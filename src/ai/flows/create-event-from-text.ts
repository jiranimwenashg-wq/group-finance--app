'use server';

/**
 * @fileOverview An AI flow to parse natural language text into a structured calendar event.
 *
 * - createEventFromText - A function that handles the event parsing.
 * - CreateEventFromTextInput - The input type for the function.
 * - CreateEventFromTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateEventFromTextInputSchema = z.object({
  prompt: z.string().describe('The natural language prompt describing the event.'),
});
export type CreateEventFromTextInput = z.infer<typeof CreateEventFromTextInputSchema>;

const CreateEventFromTextOutputSchema = z.object({
  title: z.string().describe('The title of the event.'),
  date: z.string().describe('The date of the event in YYYY-MM-DD format.'),
  description: z.string().optional().describe('A brief description of the event.'),
});
export type CreateEventFromTextOutput = z.infer<typeof CreateEventFromTextOutputSchema>;

export async function createEventFromText(
  input: CreateEventFromTextInput
): Promise<CreateEventFromTextOutput> {
  return createEventFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createEventFromTextPrompt',
  input: {schema: CreateEventFromTextInputSchema},
  output: {schema: CreateEventFromTextOutputSchema},
  prompt: `You are an intelligent assistant that creates calendar events from natural language.
  
  The current date is ${new Date().toDateString()}.
  
  Parse the following prompt and extract the event details.
  
  Prompt: {{{prompt}}}
  
  Return the output as a JSON object with the title, date (in YYYY-MM-DD format), and an optional description.`,
});

const createEventFromTextFlow = ai.defineFlow(
  {
    name: 'createEventFromTextFlow',
    inputSchema: CreateEventFromTextInputSchema,
    outputSchema: CreateEventFromTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
