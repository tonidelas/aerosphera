-- Create the boards table
CREATE TABLE IF NOT EXISTS public.boards (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    creator_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Or ON DELETE CASCADE if a board should be deleted if the creator is deleted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    banner_image_url TEXT,
    icon_image_url TEXT,
    CONSTRAINT name_length_check CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
    CONSTRAINT slug_length_check CHECK (char_length(slug) >= 3 AND char_length(slug) <= 100),
    CONSTRAINT slug_format_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$') -- basic slug format: lowercase-alphanumeric-with-hyphens
);

COMMENT ON TABLE public.boards IS 'User-created discussion boards or communities, similar to subreddits.';
COMMENT ON COLUMN public.boards.name IS 'Display name of the board.';
COMMENT ON COLUMN public.boards.slug IS 'URL-friendly identifier for the board.';
COMMENT ON COLUMN public.boards.creator_user_id IS 'The user who created the board.';
COMMENT ON COLUMN public.boards.banner_image_url IS 'URL for the board''s banner image.';
COMMENT ON COLUMN public.boards.icon_image_url IS 'URL for the board''s icon image.';

-- Create an index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_boards_slug ON public.boards(slug);

-- Create an index on creator_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_boards_creator_user_id ON public.boards(creator_user_id);

-- Alter the posts table to add board_id
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE; -- If a board is deleted, its posts are deleted. Alternatively, ON DELETE SET NULL if posts should remain but unassigned.

-- Create an index on board_id in posts table for faster lookups when fetching posts for a board
CREATE INDEX IF NOT EXISTS idx_posts_board_id ON public.posts(board_id);

COMMENT ON COLUMN public.posts.board_id IS 'The board to which this post belongs.';

-- Create the board_subscriptions table
CREATE TABLE IF NOT EXISTS public.board_subscriptions (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Changed from public.auth.users(id)
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, board_id)
);

COMMENT ON TABLE public.board_subscriptions IS 'Tracks user subscriptions to boards.';

-- Create indexes for faster lookups on subscriptions
CREATE INDEX IF NOT EXISTS idx_board_subscriptions_user_id ON public.board_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_board_subscriptions_board_id ON public.board_subscriptions(board_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on boards table
CREATE TRIGGER trigger_boards_updated_at
BEFORE UPDATE ON public.boards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS) for the new tables (IMPORTANT!)
-- You will need to define specific policies based on your app's access rules.
-- These are placeholder enablement commands.

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_subscriptions ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (you MUST tailor these to your app's logic):

-- For boards:
-- Allow public read access to boards
CREATE POLICY "Allow public read access to boards"
ON public.boards
FOR SELECT
USING (true);

-- Allow authenticated users to create boards
CREATE POLICY "Allow authenticated users to create boards"
ON public.boards
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow board creators to update their own boards
CREATE POLICY "Allow board creators to update their own boards"
ON public.boards
FOR UPDATE
USING (auth.uid() = creator_user_id)
WITH CHECK (auth.uid() = creator_user_id);

-- Allow board creators to delete their own boards (be cautious with delete policies)
-- CREATE POLICY "Allow board creators to delete their own boards"
-- ON public.boards
-- FOR DELETE
-- USING (auth.uid() = creator_user_id);


-- For board_subscriptions:
-- Allow users to manage their own subscriptions
CREATE POLICY "Allow users to manage their own subscriptions"
ON public.board_subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- For posts (assuming you have RLS on posts, you might need to adjust it)
-- Example: Posts are public within a board, or only to subscribers, etc.
-- This is just a placeholder to remind you to check posts RLS.
-- ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY; (if not already enabled)
-- CREATE POLICY "Allow public read access to posts within a board"
-- ON public.posts
-- FOR SELECT
-- USING (true); -- You'd likely check board visibility here


-- Notify PostgREST to reload schema (important for API changes to take effect immediately)
NOTIFY pgrst, 'reload schema'; 