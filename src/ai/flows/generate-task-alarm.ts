'use server';
/**
 * @fileOverview Generates a motivational message and an audio alarm for a task.
 *
 * - generateTaskAlarm - A function that handles the alarm generation process.
 * - GenerateTaskAlarmInput - The input type for the generateTaskAlarm function.
 * - GenerateTaskAlarmOutput - The return type for the generateTaskAlarm function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

const GenerateTaskAlarmInputSchema = z.object({
  taskDescription: z.string().describe('The description of the task.'),
});
export type GenerateTaskAlarmInput = z.infer<typeof GenerateTaskAlarmInputSchema>;

const GenerateTaskAlarmOutputSchema = z.object({
  message: z.string().describe('A beautiful and motivational message about the task.'),
  audioDataUri: z.string().describe("The audio alarm as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type GenerateTaskAlarmOutput = z.infer<typeof GenerateTaskAlarmOutputSchema>;

export async function generateTaskAlarm(input: GenerateTaskAlarmInput): Promise<GenerateTaskAlarmOutput> {
  return generateTaskAlarmFlow(input);
}

// Helper function to convert PCM data to WAV format
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateTaskAlarmFlow = ai.defineFlow(
  {
    name: 'generateTaskAlarmFlow',
    inputSchema: GenerateTaskAlarmInputSchema,
    outputSchema: GenerateTaskAlarmOutputSchema,
  },
  async ({ taskDescription }) => {
    const [messageResponse, audioResponse] = await Promise.all([
      ai.generate({
        prompt: `Generate a short, beautiful, and motivational message for completing the following task: "${taskDescription}"`,
        model: 'googleai/gemini-2.0-flash',
      }),
      ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: `Time is up for your task: ${taskDescription}. You can do this!`,
      }),
    ]);
    
    const message = messageResponse.text;
    const { media } = audioResponse;

    if (!media) {
      throw new Error('Audio generation failed.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);
    const audioDataUri = `data:audio/wav;base64,${wavBase64}`;

    return {
      message,
      audioDataUri,
    };
  }
);
