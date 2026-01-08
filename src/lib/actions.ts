'use server';

import { generateTaskAlarm } from '@/ai/flows/generate-task-alarm';

export async function getTaskAlarm(taskDescription: string) {
    try {
        const result = await generateTaskAlarm({ taskDescription });
        return result;
    } catch (error) {
        console.error('Error fetching task alarm:', error);
        return null;
    }
}
