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
    // Check if the notes table exists, if not create it
    const { error: checkError } = await supabaseAdmin.from('notes').select('id').limit(1);
    
    if (checkError && checkError.message.includes('does not exist')) {
      // Table doesn't exist, let's create it
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.notes (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT,
          user_id TEXT NOT NULL,
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
        
        DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
        CREATE TRIGGER update_notes_updated_at
        BEFORE UPDATE ON public.notes
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
      `;
      
      const { error: createError } = await supabaseAdmin.rpc('pgtsql_query', { 
        query: createTableQuery 
      });
      
      if (createError) {
        console.log("Can't create table automatically. Please run the SQL manually:", createError);
      }
    }

    // Handle different request methods
    switch (req.method) {
      case 'GET':
        // Get all notes for the current user
        const { data: notes, error } = await supabaseAdmin
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json(notes || []);

      case 'POST':
        // Create a new note
        const { title, content } = req.body;
        
        if (!title) {
          return res.status(400).json({ error: 'Title is required' });
        }

        const { data: newNote, error: createError } = await supabaseAdmin
          .from('notes')
          .insert({
            title,
            content: content || '',
            user_id: userId,
          })
          .select()
          .single();

        if (createError) throw createError;
        return res.status(201).json(newNote);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});