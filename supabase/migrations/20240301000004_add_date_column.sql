-- Add date column to posts table
ALTER TABLE IF EXISTS public.posts 
ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE;

-- Update existing posts to have a date value
UPDATE public.posts
SET date = created_at
WHERE date IS NULL;

-- Make date column non-nullable for future inserts
ALTER TABLE public.posts
ALTER COLUMN date SET NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.posts.date IS 'Date when the post was published'; 