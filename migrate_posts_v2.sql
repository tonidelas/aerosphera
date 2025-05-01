-- Add columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS background TEXT;

-- Add Deezer track columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deezer_track_id TEXT,
ADD COLUMN IF NOT EXISTS deezer_track_info JSONB;

-- Set default background for existing posts
UPDATE posts
SET background = 'linear-gradient(135deg, #F5F9FF, #E4EFF7)'
WHERE background IS NULL;

-- Update the schema cache (for PostgREST)
NOTIFY pgrst, 'reload schema'; 