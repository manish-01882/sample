import React, { createContext, useContext, ReactNode } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

interface Auth0SupabaseContextType {
  user: ReturnType<typeof useUser>['user'];
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  error: Error | null;
  login: () => void;
  logout: () => Promise<void>;
}

const Auth0SupabaseContext = createContext<Auth0SupabaseContextType | undefined>(undefined);

export function Auth0SupabaseProvider({ children }: { children: ReactNode }) {
  // Get Auth0 user
  const { user: auth0User, error: auth0Error, isLoading: auth0Loading } = useUser();
  
  // State for Supabase user
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Sync Auth0 user with Supabase
  useEffect(() => {
    async function syncUserWithSupabase() {
      if (auth0Loading) return;
      
      try {
        if (auth0User) {
          // If Auth0 user exists, check if they're logged in to Supabase
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (!sessionData.session) {
            // If no Supabase session exists, call our API to ensure the user exists in Supabase
            const response = await fetch('/api/auth/supabase-token');
            if (!response.ok) {
              throw new Error('Failed to sync Auth0 user with Supabase');
            }
            
            // We got the token from the API, but we won't use it for Supabase auth
            // since we're using the direct API approach instead
            // Let's just log a message to indicate successful sync
            console.log("Auth0 user synced with Supabase database");
            
            // We'll treat the Auth0 user as our main user, no need for Supabase auth
            setLoading(false);
          } else {
            // User is already signed in to Supabase - this might happen if they logged in before
            setSupabaseUser(sessionData.session.user);
          }
        } else {
          // If no Auth0 user, sign out from Supabase too
          await supabase.auth.signOut();
          setSupabaseUser(null);
        }
      } catch (err) {
        console.error('Error syncing Auth0 user with Supabase:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }
    
    syncUserWithSupabase();
  }, [auth0User, auth0Loading]);
  
  // Listen for Supabase auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Trigger a login with Auth0 (redirects to Auth0)
  const login = () => {
    // Use a simpler approach without custom parameters
    window.location.href = '/api/auth/login';
  };
  
  // Trigger a logout (both Auth0 and Supabase)
  const logout = async () => {
    // Sign out from Supabase first
    await supabase.auth.signOut();
    
    // Then redirect to Auth0 logout
    window.location.href = '/api/auth/logout';
  };

  const value = {
    user: auth0User,
    supabaseUser,
    loading: auth0Loading || loading,
    error: auth0Error || error,
    login,
    logout
  };

  return (
    <Auth0SupabaseContext.Provider value={value}>
      {children}
    </Auth0SupabaseContext.Provider>
  );
}

export function useAuth0Supabase() {
  const context = useContext(Auth0SupabaseContext);
  if (context === undefined) {
    throw new Error('useAuth0Supabase must be used within an Auth0SupabaseProvider');
  }
  return context;
}