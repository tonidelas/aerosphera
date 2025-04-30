-- Add rawContent column to posts table
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS "rawContent" JSONB;

-- Add comment explaining the column
COMMENT ON COLUMN public.posts."rawContent" IS 'Raw content for the post editor in JSON format'; 