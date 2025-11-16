'use server';

/**
 * @fileOverview An AI flow to parse natural language text into a structured calendar event, with support for recurrence.
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

const RecurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).describe('The frequency of the repeating event.'),
  interval: z.number().optional().describe('The interval of the frequency (e.g., every 2 for every 2 weeks). Defaults to 1.'),
  endDate: z.string().optional().describe('The end date for the repeating event in YYYY-MM-DD format.'),
  count: z.number().optional().describe('The number of times the event should repeat.'),
});

const CreateEventFromTextOutputSchema = z.object({
  title: z.string().describe('The title of the event.'),
  date: z.string().describe('The start date of the event in YYYY-MM-DD format.'),
  description: z.string().optional().describe('A brief description of the event.'),
  recurrence: RecurrenceSchema.optional().describe('Details for a repeating event.'),
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
  
  - If the event is a repeating event (e.g., "every week", "monthly"), populate the 'recurrence' object.
  - Determine the frequency ('daily', 'weekly', 'monthly', 'yearly').
  - Determine the end condition, which can be a specific 'endDate' or a 'count' of occurrences. For example, "for 5 weeks" means a count of 5. "until December" means an endDate.
  - The start 'date' should be the first occurrence of the event.

  Prompt: {{{prompt}}}
  
  Return the output as a JSON object.`,
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
