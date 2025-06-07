import { supabase } from './supabase';
import { Database } from './database.types';

type ChatHistory = Database['public']['Tables']['chat_history']['Row'];
type NewChatHistory = Database['public']['Tables']['chat_history']['Insert'];

export async function saveChatMessage(
  userId: string,
  message: string,
  response: string,
  messageType: 'text' | 'image' = 'text',
  imageUrl?: string | null,
  conversationId?: string
) {
  const newMessage: NewChatHistory = {
    user_id: userId,
    message,
    response,
    message_type: messageType,
    image_url: imageUrl,
    conversation_id: conversationId || crypto.randomUUID(),
  };

  const { data, error } = await supabase
    .from('chat_history')
    .insert(newMessage)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getChatHistory(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as ChatHistory[];
}

export async function getConversationHistory(conversationId: string) {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as ChatHistory[];
} 