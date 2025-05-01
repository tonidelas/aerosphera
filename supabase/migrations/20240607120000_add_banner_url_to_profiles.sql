-- Add banner_url to profiles for profile banners (images or GIFs)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT; 