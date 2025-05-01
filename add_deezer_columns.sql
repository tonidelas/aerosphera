-- Add Deezer track columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deezer_track_id TEXT,
ADD COLUMN IF NOT EXISTS deezer_track_info JSONB;

-- Update the schema cache (for PostgREST)
NOTIFY pgrst, 'reload schema'; 