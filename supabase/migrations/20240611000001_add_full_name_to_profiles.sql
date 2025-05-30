ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Optional: You might want to backfill this column for existing users
-- For example, setting it to their username or part of their email if appropriate
-- UPDATE public.profiles
-- SET full_name = COALESCE(username, email) -- or some other default like email
-- WHERE full_name IS NULL;

NOTIFY pgrst, 'reload schema'; 