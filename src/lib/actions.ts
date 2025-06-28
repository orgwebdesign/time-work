'use server';

import { suggestSimilarTasks } from '@/ai/flows/suggest-similar-tasks';

export async function getSuggestions(taskDescription: string) {
  try {
    const result = await suggestSimilarTasks({ taskDescription });
    return result.suggestedTasks;
  } catch (error) {
    console.error('Error fetching task suggestions:', error);
    return [];
  }
}
