import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';
import { generateTextResponse, generateImage } from '../../../lib/gemini-service';

// Generate a UUID as a fallback if the uuid package is not available
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Protected API route using Auth0 authentication
export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get Auth0 session
  const session = await getSession(req, res);
  if (!session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Create Supabase admin client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // User ID from Auth0
  const userId = session.user.sub;

  try {
    // Check if the chat_messages table exists, if not create it
    const { error: checkError } = await supabaseAdmin.from('chat_messages').select('id').limit(1);
    
    if (checkError && checkError.message.includes('does not exist')) {
      // Table doesn't exist, let's create it - but we'll use the simple version without custom columns
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.chat_messages (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          message TEXT NOT NULL,
          response TEXT,
          conversation_id TEXT,
          is_completed BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE OR REPLACE FUNCTION public.handle_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON public.chat_messages;
        CREATE TRIGGER update_chat_messages_updated_at
        BEFORE UPDATE ON public.chat_messages
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
      `;
      
      try {
        // Direct query through Supabase
        try {
          await supabaseAdmin.rpc('pgtsql_query', { 
            query: createTableQuery 
          });
        } catch (err) {
          console.log("Can't create table automatically. Please run the SQL manually:", err);
        }
      } catch (err) {
        console.error("Error creating table:", err);
      }
    }

    // Handle different request methods
    switch (req.method) {
      case 'GET':
        // Get conversation ID from query params or return all messages
        const conversationId = req.query.conversationId as string;
        
        let query = supabaseAdmin
          .from('chat_messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (conversationId) {
          query = query.eq('conversation_id', conversationId);
        }
        
        const { data: messages, error } = await query;

        if (error) throw error;
        return res.status(200).json(messages || []);

      case 'POST':
        // Create a new chat message
        const { message, conversationId: msgConversationId } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        // Use provided conversation ID or generate a new one
        const convoId = msgConversationId || generateUUID();

        // Save the message (without response initially)
        const { data: newMessage, error: createError } = await supabaseAdmin
          .from('chat_messages')
          .insert({
            user_id: userId,
            message,
            conversation_id: convoId,
            is_completed: false
          })
          .select()
          .single();

        if (createError) throw createError;
        
        // Parse the message to determine if it's an image request
        const messageText = message.toLowerCase().trim();
        let aiResponse = "";
        let isImageRequest = false;
        let imageUrl = "";
        
        // Check if this is an image generation request
        if (messageText.includes("generate image") || 
            messageText.includes("create image") || 
            messageText.includes("draw") || 
            messageText.includes("picture of") ||
            messageText.match(/image\s+of/i)) {
          
          isImageRequest = true;
          
          // Improved: Remove trigger phrases and use the rest as the prompt
          let imagePrompt = messageText
            .replace(/^generate image( of)?/i, '')
            .replace(/^create image( of)?/i, '')
            .replace(/^draw( a| an| the)?/i, '')
            .replace(/^picture of/i, '')
            .replace(/^image of/i, '')
            .trim();
          
          try {
            // Generate image with Gemini
            console.log('Generating image with prompt:', imagePrompt);
            imageUrl = await generateImage(imagePrompt);
            aiResponse = `I've generated an image based on "${imagePrompt}". Here it is!`;
          } catch (error) {
            console.error('Image generation error:', error);
            // Fallback to a placeholder image
            const randomSeed = Math.floor(Math.random() * 1000);
            imageUrl = `https://picsum.photos/seed/${randomSeed}/512/512`;
            aiResponse = `I tried to generate an image based on "${imagePrompt}", but encountered an error. Here's a placeholder image instead.`;
          }
        } else {
          // For text responses, use Gemini
          try {
            // Create a system prompt for the AI
            const systemPrompt = `You are an AI assistant that provides helpful, accurate, and ethical responses. 
            The user's message is: "${message}"
            
            Provide a concise, helpful response that addresses the user's question or comment.`;
            
            // Generate response using Gemini
            aiResponse = await generateTextResponse(systemPrompt);
            
            // Fallback if Gemini returns an empty response
            if (!aiResponse || aiResponse.trim() === '') {
              aiResponse = "I'm sorry, I wasn't able to generate a response. Please try rephrasing your question.";
            }
          } catch (error) {
            console.error('Text generation error:', error);
            
            // Fallback responses
            if ((messageText === "hello" || messageText === "hi" || messageText === "hey") || 
                (messageText.length < 5 && (messageText.includes("hi") || messageText.includes("hey")))) {
              aiResponse = "Hello! How can I assist you today?";
            } else if (messageText.includes("help me") || messageText === "help" || messageText === "can you help") {
              aiResponse = "I'm here to help! I can answer questions, provide information, or just chat with you about various topics. What would you like to know?";
            } else if (messageText.includes("thank")) {
              aiResponse = "You're welcome! Feel free to ask if you need anything else.";
            } else {
              aiResponse = "I'm sorry, I encountered an error processing your request. Could you try again with a different question?";
            }
          }
        }
        
        // Include image URL in the response text if it's an image request
        let finalResponse = aiResponse;
        if (isImageRequest) {
          finalResponse = `${aiResponse}\n\nIMAGE_URL: ${imageUrl}`;
        }
        
        // Update the message with the response
        const { data: updatedMessage, error: updateError } = await supabaseAdmin
          .from('chat_messages')
          .update({
            response: finalResponse,
            is_completed: true
          })
          .eq('id', newMessage.id)
          .select()
          .single();
          
        // Prepare the response for the client
        let responseData = { ...updatedMessage };
        
        // If this is an image response, add the virtual fields
        if (isImageRequest) {
          responseData = {
            ...responseData,
            response_type: 'image',
            image_url: imageUrl,
            response: aiResponse // Use the original response without the URL
          };
        } else {
          responseData.response_type = 'text';
        }
          
        if (updateError) throw updateError;
        
        return res.status(201).json(responseData);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});