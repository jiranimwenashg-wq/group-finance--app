// src/ai/flows/query-constitution.ts
'use server';
/**
 * @fileOverview A flow for querying the group's constitution using AI.
 *
 * - queryConstitution - A function that handles querying the constitution.
 * - QueryConstitutionInput - The input type for the queryConstitution function.
 * - QueryConstitutionOutput - The return type for the queryConstitution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QueryConstitutionInputSchema = z.object({
  constitutionText: z
    .string()
    .describe('The text of the group constitution.'),
  query: z.string().describe('The question about the constitution.'),
});
export type QueryConstitutionInput = z.infer<typeof QueryConstitutionInputSchema>;

const QueryConstitutionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the constitution.'),
});
export type QueryConstitutionOutput = z.infer<typeof QueryConstitutionOutputSchema>;

export async function queryConstitution(input: QueryConstitutionInput): Promise<QueryConstitutionOutput> {
  return queryConstitutionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'queryConstitutionPrompt',
  input: {schema: QueryConstitutionInputSchema},
  output: {schema: QueryConstitutionOutputSchema},
  prompt: `You are an AI assistant that answers questions about a group's constitution.

  Here is the constitution text:
  {{constitutionText}}

  Answer the following question about the constitution:
  {{query}}`,
});

const queryConstitutionFlow = ai.defineFlow(
  {
    name: 'queryConstitutionFlow',
    inputSchema: QueryConstitutionInputSchema,
    outputSchema: QueryConstitutionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
