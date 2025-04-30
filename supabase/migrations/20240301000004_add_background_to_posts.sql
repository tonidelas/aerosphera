-- Add background column to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS background VARCHAR(255) DEFAULT '#ffffff'; 