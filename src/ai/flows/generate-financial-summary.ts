'use server';

/**
 * @fileOverview AI flow to generate narrative summaries of financial reports.
 *
 * - generateFinancialSummary - A function that generates financial summaries.
 * - GenerateFinancialSummaryInput - The input type for the generateFinancialSummary function.
 * - GenerateFinancialSummaryOutput - The return type for the generateFinancialSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFinancialSummaryInputSchema = z.object({
  financialReport: z
    .string()
    .describe('The financial report data to be summarized.'),
});
export type GenerateFinancialSummaryInput = z.infer<
  typeof GenerateFinancialSummaryInputSchema
>;

const GenerateFinancialSummaryOutputSchema = z.object({
  summary: z.string().describe('A narrative summary of the financial report.'),
});
export type GenerateFinancialSummaryOutput = z.infer<
  typeof GenerateFinancialSummaryOutputSchema
>;

export async function generateFinancialSummary(
  input: GenerateFinancialSummaryInput
): Promise<GenerateFinancialSummaryOutput> {
  return generateFinancialSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFinancialSummaryPrompt',
  input: {schema: GenerateFinancialSummaryInputSchema},
  output: {schema: GenerateFinancialSummaryOutputSchema},
  prompt: `You are an expert financial analyst. Please provide a narrative summary of the following financial report.

Financial Report:
{{{financialReport}}}`,
});

const generateFinancialSummaryFlow = ai.defineFlow(
  {
    name: 'generateFinancialSummaryFlow',
    inputSchema: GenerateFinancialSummaryInputSchema,
    outputSchema: GenerateFinancialSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
