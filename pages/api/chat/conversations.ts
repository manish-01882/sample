import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';

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
    if (req.method === 'GET') {
      // Get distinct conversations for this user
      const { data, error } = await supabaseAdmin
        .from('chat_messages')
        .select('conversation_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get the unique conversation IDs and the first message of each
      const conversationMap = new Map();
      
      data?.forEach(item => {
        if (!conversationMap.has(item.conversation_id)) {
          conversationMap.set(item.conversation_id, {
            id: item.conversation_id,
            created_at: item.created_at
          });
        }
      });
      
      const conversations = Array.from(conversationMap.values());
      
      return res.status(200).json(conversations);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});