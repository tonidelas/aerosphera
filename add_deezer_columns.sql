-- Add Deezer track columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deezer_track_id TEXT,
ADD COLUMN IF NOT EXISTS deezer_track_info JSONB;

-- Add image_url column to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add background column to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS background TEXT;

-- Update the schema cache (for PostgREST)
NOTIFY pgrst, 'reload schema'; 