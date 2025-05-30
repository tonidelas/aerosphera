-- Check if the 'date' column exists and add a default value if it does
-- This will fix the "null value in column 'date'" error when creating posts

DO $$
BEGIN
    -- Check if the 'date' column exists in the posts table
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'date'
    ) THEN
        -- If the column exists, add a default value
        ALTER TABLE public.posts 
        ALTER COLUMN date SET DEFAULT NOW();
        
        -- Also set default for any existing NULL values
        UPDATE public.posts 
        SET date = created_at 
        WHERE date IS NULL;
        
        RAISE NOTICE 'Added default value to posts.date column';
    ELSE
        RAISE NOTICE 'No date column found in posts table';
    END IF;
END $$; 