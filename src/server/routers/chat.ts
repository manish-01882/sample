import { t } from '../context';
import { z } from 'zod';
import { generateResponse, generateConversationTitle } from '../../lib/gemini';

export const chatRouter = t.router({
  hello: t.procedure.query(() => {
    return { greeting: 'Hello from tRPC!' };
  }),
  sendMessage: t.procedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.session?.user) {
          return { 
            reply: 'Please log in to continue chatting.',
            error: 'UNAUTHORIZED'
          };
        }

        if (!input.message.trim()) {
          return {
            reply: 'Message cannot be empty.',
            error: 'INVALID_INPUT'
          };
        }

        // Call Gemini API
        const reply = await generateResponse(input.message);
        
        if (!reply) {
          throw new Error('No response received from Gemini');
        }

        return { 
          reply,
          timestamp: new Date().toISOString()
        };
      } catch (error: any) {
        console.error('Chat error:', error);
        return {
          reply: error.message || 'An error occurred while processing your message.',
          error: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        };
      }
    }),
  generateTitle: t.procedure
    .input(z.object({
      messages: z.array(z.object({
        content: z.string(),
        from: z.enum(['user', 'ai'])
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('Received title generation request with messages:', input.messages);
        
        if (!ctx.session?.user) {
          console.log('Unauthorized title generation attempt');
          return { 
            title: 'New Conversation',
            error: 'UNAUTHORIZED'
          };
        }

        const title = await generateConversationTitle(input.messages);
        console.log('Generated title:', title);
        
        return { title };
      } catch (error: any) {
        console.error('Title generation error:', error);
        return {
          title: 'New Conversation',
          error: 'INTERNAL_ERROR'
        };
      }
    })
});
