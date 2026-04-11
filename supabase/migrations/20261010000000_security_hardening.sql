-- ============================================================
-- Security Hardening Patch for RLS Vulnerabilities
-- ============================================================

-- 1. Patch boards INSERT
-- Fix: Prevent authenticated users from creating boards under a different user's name.
DROP POLICY IF EXISTS "Allow authenticated users to create boards" ON public.boards;
CREATE POLICY "Allow authenticated users to create boards"
ON public.boards
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = creator_user_id);

-- 2. Patch board_mod_log INSERT
-- Fix: Prevent arbitrary users from injecting false moderation logs. Restrict to owner or moderator, and ensure they are the ones logging.
DROP POLICY IF EXISTS "board_mod_log_insert" ON public.board_mod_log;
CREATE POLICY "board_mod_log_insert" ON public.board_mod_log FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND mod_user_id = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = board_mod_log.board_id AND user_id = auth.uid() AND role = 'moderator')
  )
);

-- 3. Patch board-images Storage Bucket INSERT
-- Fix: Prevent users from uploading images into someone else's folder. Enforces `uid` prefix.
DROP POLICY IF EXISTS "Authenticated users can upload board images" ON storage.objects;
CREATE POLICY "Authenticated users can upload board images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'board-images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Patch board_roles INSERT
-- Fix: Prevent owner from spoofing `granted_by` when appointing moderators.
DROP POLICY IF EXISTS "board_roles_insert" ON public.board_roles;
CREATE POLICY "board_roles_insert" ON public.board_roles FOR INSERT
WITH CHECK (
  granted_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
);

-- 5. Patch board_bans INSERT
-- Fix: Prevent granting bans and spoofing the `banned_by` user. Also implicit requirement to be owner/mod.
DROP POLICY IF EXISTS "board_bans_insert" ON public.board_bans;
CREATE POLICY "board_bans_insert" ON public.board_bans FOR INSERT
WITH CHECK (
  banned_by = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = board_bans.board_id AND user_id = auth.uid() AND role = 'moderator')
  )
);

-- Reload PostgREST schema cleanly
NOTIFY pgrst, 'reload schema';
