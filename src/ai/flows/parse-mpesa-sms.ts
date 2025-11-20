'use server';

/**
 * @fileOverview Parses an M-Pesa SMS message to extract transaction data and identify a member.
 *
 * - parseMpesaSms - A function that handles the SMS parsing process.
 * - ParseMpesaSmsInput - The input type for the parseMpesaSms function.
 * - ParseMpesaSmsOutput - The return type for the parseMpesaSms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseMpesaSmsInputSchema = z.object({
  smsText: z.string().describe('The text content of the M-Pesa SMS message.'),
  members: z
    .array(z.object({id: z.string(), name: z.string()}))
    .describe(
      'A list of group members to check against the transaction details.'
    ),
});
export type ParseMpesaSmsInput = z.infer<typeof ParseMpesaSmsInputSchema>;

// This is the output schema from the AI prompt
const InternalParseMpesaSmsOutputSchema = z.object({
  amount: z.number().describe('The transaction amount.'),
  day: z.number().describe('The day of the month (e.g., 25).'),
  month: z.number().describe('The month of the year (1-12).'),
  year: z.number().describe('The full year (e.g., 2024).'),
  time: z.string().describe('The time of the transaction (e.g., 7:30 PM).'),
  senderRecipient: z
    .string()
    .describe('The sender or recipient of the transaction.'),
  transactionType: z
    .string()
    .describe(
      'The type of transaction (e.g., deposit, withdrawal, payment).'
    ),
  transactionCost: z
    .number()
    .optional()
    .describe('The cost of the transaction, if available'),
  memberId: z
    .string()
    .optional()
    .describe(
      "The ID of the member if the sender or recipient matches a name in the provided member list."
    ),
});

// This is the final output schema for the flow
const ParseMpesaSmsOutputSchema = z.object({
  amount: z.number(),
  date: z.string().describe('The date and time in ISO format.'),
  senderRecipient: z.string(),
  transactionType: z.string(),
  transactionCost: z.number().optional(),
  memberId: z.string().optional(),
});
export type ParseMpesaSmsOutput = z.infer<typeof ParseMpesaSmsOutputSchema>;

export async function parseMpesaSms(
  input: ParseMpesaSmsInput
): Promise<ParseMpesaSmsOutput> {
  return parseMpesaSmsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseMpesaSmsPrompt',
  input: {schema: ParseMpesaSmsInputSchema},
  output: {schema: InternalParseMpesaSmsOutputSchema},
  prompt: `You are an expert financial assistant specializing in parsing M-Pesa SMS messages from Kenya.

Your task is to extract structured data from the provided SMS text. Carefully analyze the SMS examples below to understand the different formats.

**Examples of M-Pesa SMS formats:**

1.  **Receive Money:** "SDB1234567 Confirmed. You have received Ksh5,000.00 from JOHN DOE 254712345678 on 25/7/24 at 7:30 PM. New M-PESA balance is Ksh15,250.00."
    *   **Amount**: 5000.00
    *   **Day**: 25
    *   **Month**: 7
    *   **Year**: 2024
    *   **Time**: 7:30 PM
    *   **Sender/Recipient**: JOHN DOE
    *   **Transaction Type**: Income

2.  **Send Money:** "SDB1234568 Confirmed. Ksh3,000.00 sent to JANE DOE 254722987654 on 26/7/24 at 10:15 AM. New M-PESA balance is Ksh12,250.00. Transaction cost, Ksh23.00."
    *   **Amount**: 3000.00
    *   **Day**: 26
    *   **Month**: 7
    *   **Year**: 2024
    *   **Time**: 10:15 AM
    *   **Sender/Recipient**: JANE DOE
    *   **Transaction Type**: Expense
    *   **Transaction Cost**: 23.00

3.  **Pay Bill:** "SDB1234569 Confirmed. Ksh1,500.00 sent to KPLC PREPAID for account 123456-78 on 27/7/24 at 11:00 AM. New M-PESA balance is Ksh10,750.00."
    *   **Amount**: 1500.00
    *   **Day**: 27
    *   **Month**: 7
    *   **Year**: 2024
    *   **Time**: 11:00 AM
    *   **Sender/Recipient**: KPLC PREPAID
    *   **Transaction Type**: Expense

**Instructions:**

1.  **Extract Key Information**:
    *   **amount**: The main transaction amount (ignore balance and transaction cost).
    *   **day**: The numerical day of the month from the date (e.g., 25 from 25/7/24).
    *   **month**: The numerical month of the year (e.g., 7 from 25/7/24).
    *   **year**: The full four-digit year. Assume the current century if only two digits are given (e.g. 24 -> 2024).
    *   **time**: The time of the transaction (e.g., 7:30 PM).
    *   **senderRecipient**: The full name of the person or business involved. Extract only the name, not the phone number.
    *   **transactionType**: "Income" if money is received, "Expense" if money is sent or used for a payment.
    *   **transactionCost**: The cost of the transaction, if available.

2.  **Match Member**:
    *   Compare the extracted **senderRecipient** name against the provided **Members List**.
    *   If a close match is found, set the 'memberId' field in the output to the corresponding member's ID.
    *   If no match is found, omit the 'memberId' field.

**Input Data:**

**Members List:**
{{#each members}}
- ID: {{id}}, Name: {{name}}
{{/each}}

**SMS Message to Parse:**
\`\`\`
{{{smsText}}}
\`\`\`

Return the final extracted data as a JSON object.`,
});

const parseMpesaSmsFlow = ai.defineFlow(
  {
    name: 'parseMpesaSmsFlow',
    inputSchema: ParseMpesaSmsInputSchema,
    outputSchema: ParseMpesaSmsOutputSchema,
  },
  async (input) => {
    const {output: llmOutput} = await prompt(input);
    if (!llmOutput) {
      throw new Error('AI failed to parse SMS.');
    }

    // Reconstruct the date string from the AI's output
    // This is more reliable than asking the LLM to format the date itself.
    const {day, month, time} = llmOutput;
    let {year} = llmOutput;

    // Handle 2-digit year
    if (year < 100) {
      year += 2000;
    }

    // Robust time parsing
    const timeString = time.toLowerCase();
    const timeRegex = /(\d{1,2}):(\d{2})/;
    const match = timeString.match(timeRegex);

    if (!match) {
        throw new Error(`Could not parse time: ${time}`);
    }

    let [_, hours, minutes] = match.map(Number);

    if (timeString.includes('pm') && hours < 12) {
      hours += 12;
    }
    if (timeString.includes('am') && hours === 12) {
      hours = 0; // Midnight case
    }
    
    const date = new Date(year, month - 1, day, hours, minutes);

    if (isNaN(date.getTime())) {
        throw new Error('Could not create a valid date from the parsed components.');
    }

    return {
      ...llmOutput,
      date: date.toISOString(),
    };
  }
);
