-- Run this SQL in your Supabase dashboard's SQL Editor
-- This adds the banner_url column to the profiles table

-- Add banner_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.banner_url IS 'URL to the profile banner image or GIF';

-- Verify that the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'banner_url'; 