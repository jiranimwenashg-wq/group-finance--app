'use server';

/**
 * @fileOverview AI flow to generate a narrative financial report card for a group member.
 *
 * - generateMemberReport - A function that generates the report.
 * - GenerateMemberReportInput - The input type for the function.
 * - GenerateMemberReportOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  type: z.enum(['Income', 'Expense']),
  category: z.string(),
});

const InsurancePaymentSchema = z.object({
  policyName: z.string(),
  status: z.string(),
});

const GenerateMemberReportInputSchema = z.object({
  memberName: z.string().describe("The name of the member."),
  transactions: z.array(TransactionSchema).describe("A list of the member's transactions."),
  insurancePayments: z.array(InsurancePaymentSchema).describe("The member's insurance payment status for the current month."),
});
export type GenerateMemberReportInput = z.infer<typeof GenerateMemberReportInputSchema>;

const GenerateMemberReportOutputSchema = z.object({
  report: z.string().describe("A narrative summary of the member's financial report card."),
});
export type GenerateMemberReportOutput = z.infer<typeof GenerateMemberReportOutputSchema>;

export async function generateMemberReport(
  input: GenerateMemberReportInput
): Promise<GenerateMemberReportOutput> {
  return generateMemberReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMemberReportPrompt',
  input: {schema: GenerateMemberReportInputSchema},
  output: {schema: GenerateMemberReportOutputSchema},
  prompt: `You are the financial secretary of a community group. Your task is to generate a concise, encouraging, and informative financial report card for a member named {{memberName}}.

Use the following data to create a short narrative summary (2-3 sentences).

**Key Information:**
- Member Name: {{memberName}}

**Recent Transactions:**
{{#if transactions}}
  {{#each transactions}}
  - {{date}}: {{description}} (Amount: {{amount}}, Type: {{type}})
  {{/each}}
{{else}}
  - No recent transactions recorded.
{{/if}}

**Recent Insurance Payments:**
{{#if insurancePayments}}
  {{#each insurancePayments}}
  - {{policyName}}: {{status}}
  {{/each}}
{{else}}
- No insurance policies tracked for this member.
{{/if}}

**Report Card Narrative Guidelines:**
1.  Start by addressing the member by name.
2.  Summarize their contribution activity based on the transactions. Mention if they are up-to-date or if there are any recent payments.
3.  Mention their insurance payment status.
4.  Keep the tone positive and professional.

Example: "Alice Johnson has been consistent with her contributions, with her latest payment recorded recently. Her insurance payments are all up-to-date, reflecting her commitment to the group's financial health."

Generate the report card for {{memberName}} now.
`,
});


const generateMemberReportFlow = ai.defineFlow(
  {
    name: 'generateMemberReportFlow',
    inputSchema: GenerateMemberReportInputSchema,
    outputSchema: GenerateMemberReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
