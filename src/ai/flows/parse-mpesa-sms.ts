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
  prompt: `You are an expert financial assistant specializing in parsing M-Pesa SMS messages.

  Extract the following information from the SMS message:
  - amount: The transaction amount.
  - date: The date and time of the transaction (ISO format).
  - senderRecipient: The sender or recipient of the transaction.
  - transactionType: The type of transaction (e.g., deposit, withdrawal, payment).
  - transactionCost: The cost of the transaction, if available.

  Additionally, analyze the sender or recipient of the transaction. Compare this name against the provided list of members.
  - If the name in the SMS corresponds to a name in the members list, set the 'memberId' field in the output to the matching member's ID.
  - If no match is found, leave the 'memberId' field null.

  Members List:
  {{#each members}}
  - ID: {{id}}, Name: {{name}}
  {{/each}}

  SMS Message: {{{smsText}}}

  Return the output as a JSON object.
  `,
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
