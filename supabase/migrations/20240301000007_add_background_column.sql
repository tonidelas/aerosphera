-- Add background column to posts table
ALTER TABLE IF EXISTS public.posts 
ADD COLUMN IF NOT EXISTS background TEXT;

-- Add rawContent column if it's missing
ALTER TABLE IF EXISTS public.posts
ADD COLUMN IF NOT EXISTS "rawContent" JSONB;

-- Update existing posts with default backgrounds
UPDATE public.posts
SET background = 'linear-gradient(135deg, #F5F9FF, #E4EFF7)'
WHERE background IS NULL; 