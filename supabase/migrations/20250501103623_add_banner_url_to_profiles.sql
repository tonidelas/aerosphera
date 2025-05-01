-- Add banner_url column to profiles table
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.banner_url IS 'URL to the profile banner image or GIF';
