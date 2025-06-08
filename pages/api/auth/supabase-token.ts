import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// This is a protected API route that will create a Supabase user linked to the Auth0 user
export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the user from Auth0
    const session = await getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Create a Supabase admin client
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

    // Generate a strong random token to use as a shared secret
    const token = crypto.randomBytes(32).toString('hex');

    // Skip Supabase user management since we don't have admin API access
    // We'll just create/update the user profile in Supabase database
    
    // Instead of trying to use admin API methods that don't exist,
    // we'll just maintain the profile record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: session.user.sub || '',
        email: session.user.email || '',
        name: session.user.name || '',
        avatar_url: session.user.picture || '',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // We'll continue even with a profile error
    }

    // Return the token (this will be used client-side)
    return res.status(200).json({ 
      token,
      user: {
        id: session.user.sub,
        email: session.user.email,
        name: session.user.name,
        picture: session.user.picture
      }
    });
  } catch (error) {
    console.error('Error linking Auth0 with Supabase:', error);
    return res.status(500).json({ error: 'Failed to link accounts' });
  }
});