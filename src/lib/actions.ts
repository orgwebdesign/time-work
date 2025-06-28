'use server';

import { suggestSimilarTasks } from '@/ai/flows/suggest-similar-tasks';
import { generateTaskAlarm } from '@/ai/flows/generate-task-alarm';

export async function getSuggestions(taskDescription: string) {
  try {
    const result = await suggestSimilarTasks({ taskDescription });
    return result.suggestedTasks;
  } catch (error) {
    console.error('Error fetching task suggestions:', error);
    return [];
  }
}

export async function getTaskAlarm(taskDescription: string) {
    try {
        const result = await generateTaskAlarm({ taskDescription });
        return result;
    } catch (error) {
        console.error('Error fetching task alarm:', error);
        return null;
    }
}
