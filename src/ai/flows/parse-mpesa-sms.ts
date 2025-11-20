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
  smsText: z
    .string()
    .describe('The text content of the M-Pesa SMS message.'),
  members: z.array(z.object({ id: z.string(), name: z.string() })).describe('A list of group members to check against the transaction details.'),
});
export type ParseMpesaSmsInput = z.infer<typeof ParseMpesaSmsInputSchema>;

const ParseMpesaSmsOutputSchema = z.object({
  amount: z.number().describe('The transaction amount.'),
  date: z.string().describe('The date and time of the transaction (ISO format).'),
  senderRecipient: z.string().describe('The sender or recipient of the transaction.'),
  transactionType: z.string().describe('The type of transaction (e.g., deposit, withdrawal, payment).'),
  transactionCost: z.number().optional().describe('The cost of the transaction, if available'),
  memberId: z.string().optional().describe('The ID of the member if the sender or recipient matches a name in the provided member list.'),
});

export type ParseMpesaSmsOutput = z.infer<typeof ParseMpesaSmsOutputSchema>;

export async function parseMpesaSms(input: ParseMpesaSmsInput): Promise<ParseMpesaSmsOutput> {
  return parseMpesaSmsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseMpesaSmsPrompt',
  input: {schema: ParseMpesaSmsInputSchema},
  output: {schema: ParseMpesaSmsOutputSchema},
  prompt: `You are an expert financial assistant specializing in parsing M-Pesa SMS messages from Kenya.

Your task is to extract structured data from the provided SMS text. Carefully analyze the SMS examples below to understand the different formats.

**Examples of M-Pesa SMS formats:**

1.  **Receive Money:** "SDB1234567 Confirmed. You have received Ksh5,000.00 from JOHN DOE 254712345678 on 25/7/24 at 7:30 PM. New M-PESA balance is Ksh15,250.00."
    *   **Amount**: 5000.00
    *   **Date**: 2024-07-25T19:30:00
    *   **Sender/Recipient**: JOHN DOE
    *   **Transaction Type**: Income

2.  **Send Money:** "SDB1234568 Confirmed. Ksh3,000.00 sent to JANE DOE 254722987654 on 26/7/24 at 10:15 AM. New M-PESA balance is Ksh12,250.00. Transaction cost, Ksh23.00."
    *   **Amount**: 3000.00
    *   **Date**: 2024-07-26T10:15:00
    *   **Sender/Recipient**: JANE DOE
    *   **Transaction Type**: Expense
    *   **Transaction Cost**: 23.00

3.  **Pay Bill:** "SDB1234569 Confirmed. Ksh1,500.00 sent to KPLC PREPAID for account 123456-78 on 27/7/24 at 11:00 AM. New M-PESA balance is Ksh10,750.00."
    *   **Amount**: 1500.00
    *   **Date**: 2024-07-27T11:00:00
    *   **Sender/Recipient**: KPLC PREPAID
    *   **Transaction Type**: Expense

**Instructions:**

1.  **Extract Key Information**:
    *   **amount**: The main transaction amount (ignore balance and transaction cost).
    *   **date**: The date and time of the transaction. Convert it to a full ISO 8601 format (YYYY-MM-DDTHH:mm:ss). Assume the current year if not specified.
    *   **senderRecipient**: The full name of the person or business involved in the transaction. Extract only the name, not the phone number.
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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
