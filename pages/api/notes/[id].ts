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
  
  // Get note ID from URL
  const noteId = req.query.id as string;
  if (!noteId) {
    return res.status(400).json({ error: 'Note ID is required' });
  }

  try {
    // Simplified approach for the DELETE operation
    if (req.method === 'DELETE') {
      // Delete a note
      const { error: deleteError } = await supabaseAdmin
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      return res.status(200).json({ success: true });
    } 
    
    // For other methods we'll return method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});