-- Create a profiles table to store user profile information
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- This will be the Auth0 user ID
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up RLS (Row Level Security) for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read any profile
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Create a policy that allows users to update only their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid()::text = id);

-- Create an items table for the example app
CREATE TABLE IF NOT EXISTS public.items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up RLS for the items table
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to read all items
CREATE POLICY "Items are viewable by authenticated users" ON public.items
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create a policy that allows users to insert their own items
CREATE POLICY "Users can insert their own items" ON public.items
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create a policy that allows users to update their own items
CREATE POLICY "Users can update their own items" ON public.items
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Create a policy that allows users to delete their own items
CREATE POLICY "Users can delete their own items" ON public.items
  FOR DELETE USING (auth.uid()::text = user_id);

-- Create a notes table for the Auth0 + Supabase example
CREATE TABLE IF NOT EXISTS public.notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- No RLS needed for notes as we're only accessing them through admin routes

-- Create a chat_messages table to store chat history
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

-- No RLS needed for chat_messages as we're accessing them through admin routes

-- Create functions for managing updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();