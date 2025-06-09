import { t } from '../context';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export const imageRouter = t.router({
  generate: t.procedure
    .input(z.object({ prompt: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash-preview-image-generation',
        });

        // Request image generation from the model
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: input.prompt }] }]
        });

        // Wait for response and process it
        const response = await result.response;
        const parts = response?.candidates?.[0]?.content?.parts || [];

        const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
        const textPart = parts.find((p) => typeof p.text === 'string');

        const base64 = imagePart?.inlineData?.data;
        const text = textPart?.text || '';

        if (!base64) {
          console.error('Response parts:', JSON.stringify(parts, null, 2));
          throw new Error('No image data returned from Gemini');
        }

        return { url: `data:image/png;base64,${base64}`, text };
      } catch (err: any) {
        console.error('Gemini image error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err?.message || 'Image generation failed',
        });
      }
    }),
});
