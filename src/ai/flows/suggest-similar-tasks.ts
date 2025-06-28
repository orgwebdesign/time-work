'use server';

/**
 * @fileOverview AI agent that suggests similar or related tasks based on a given task description.
 *
 * - suggestSimilarTasks - A function that suggests similar tasks.
 * - SuggestSimilarTasksInput - The input type for the suggestSimilarTasks function.
 * - SuggestSimilarTasksOutput - The output type for the suggestSimilarTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSimilarTasksInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('The description of the task for which to suggest similar tasks.'),
});
export type SuggestSimilarTasksInput = z.infer<typeof SuggestSimilarTasksInputSchema>;

const SuggestSimilarTasksOutputSchema = z.object({
  suggestedTasks: z
    .array(z.string())
    .describe('A list of similar or related tasks based on the input task description.'),
});
export type SuggestSimilarTasksOutput = z.infer<typeof SuggestSimilarTasksOutputSchema>;

export async function suggestSimilarTasks(input: SuggestSimilarTasksInput): Promise<SuggestSimilarTasksOutput> {
  return suggestSimilarTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSimilarTasksPrompt',
  input: {schema: SuggestSimilarTasksInputSchema},
  output: {schema: SuggestSimilarTasksOutputSchema},
  prompt: `You are a helpful assistant that suggests similar or related tasks based on a given task description.

  Given the following task description, suggest a list of similar or related tasks that a user might want to add to their to-do list.
  The list should not contain the original task, and should not be too long (3-5 tasks is ideal).

  Task Description: {{{taskDescription}}}
  `,
});

const suggestSimilarTasksFlow = ai.defineFlow(
  {
    name: 'suggestSimilarTasksFlow',
    inputSchema: SuggestSimilarTasksInputSchema,
    outputSchema: SuggestSimilarTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
