-- Add the correct foreign key constraint from posts.user_id to profiles.id
ALTER TABLE public.posts
DROP CONSTRAINT IF EXISTS posts_user_id_fkey, -- Attempt to drop common default name
DROP CONSTRAINT IF EXISTS posts_user_id_fkey_to_profiles; -- Also drop by specific name if it exists

ALTER TABLE public.posts
ADD CONSTRAINT posts_user_id_fkey_to_profiles FOREIGN KEY (user_id)
REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema'; 