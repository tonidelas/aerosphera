-- Create chatrooms table
CREATE TABLE public.chatrooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Creator of the chatroom
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chatroom_id UUID REFERENCES public.chatrooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Sender of the message
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for chatrooms and messages
ALTER TABLE public.chatrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for chatrooms
-- Allow authenticated users to read all chatrooms
CREATE POLICY "Allow authenticated users to read chatrooms"
ON public.chatrooms
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create chatrooms
CREATE POLICY "Allow authenticated users to create chatrooms"
ON public.chatrooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow creator to update their chatroom (e.g., name)
CREATE POLICY "Allow creator to update their chatroom"
ON public.chatrooms
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow creator to delete their chatroom
CREATE POLICY "Allow creator to delete their chatroom"
ON public.chatrooms
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- Policies for messages
-- Allow authenticated users to read messages in chatrooms they are part of (implicitly, all messages for now)
CREATE POLICY "Allow authenticated users to read messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true); -- For simplicity, anyone can read. Could be restricted further.

-- Allow authenticated users to send messages
CREATE POLICY "Allow authenticated users to send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow sender to update their own messages (e.g., edit typo) - within a time limit could be added
CREATE POLICY "Allow sender to update their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow sender to delete their own messages
CREATE POLICY "Allow sender to delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to get user profile for messages
CREATE OR REPLACE FUNCTION public.get_message_user_profile(message_user_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'id', p.id,
    'username', p.username,
    'avatar_url', p.avatar_url
  )
  FROM public.profiles p
  WHERE p.id = message_user_id;
$$;
