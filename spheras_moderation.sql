-- ============================================================
-- SPHERAS MODERATION SYSTEM — Run this in Supabase SQL Editor
-- ============================================================

-- 1. Board Roles (moderators)
CREATE TABLE IF NOT EXISTS public.board_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('moderator')),
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

-- 2. Board Bans
CREATE TABLE IF NOT EXISTS public.board_bans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  banned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

-- 3. Board Rules
CREATE TABLE IF NOT EXISTS public.board_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Moderator Action Log
CREATE TABLE IF NOT EXISTS public.board_mod_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  mod_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  -- action values: 'ban', 'unban', 'mute', 'remove_post', 'pin_post', 'unpin_post',
  --                'remove_member', 'appoint_mod', 'remove_mod', 'edit_settings',
  --                'create_rule', 'delete_rule', 'resolve_report', 'dismiss_report', 'transfer_ownership'
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Post Reports
CREATE TABLE IF NOT EXISTS public.post_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  reporter_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Add moderation columns to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS removal_reason TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_board_roles_board_id ON public.board_roles(board_id);
CREATE INDEX IF NOT EXISTS idx_board_roles_user_id ON public.board_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_board_bans_board_id ON public.board_bans(board_id);
CREATE INDEX IF NOT EXISTS idx_board_bans_user_id ON public.board_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_board_rules_board_id ON public.board_rules(board_id);
CREATE INDEX IF NOT EXISTS idx_board_mod_log_board_id ON public.board_mod_log(board_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_board_id ON public.post_reports(board_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_status ON public.post_reports(status);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.board_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_mod_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- board_roles: anyone can read, owner can write
DROP POLICY IF EXISTS "board_roles_select" ON public.board_roles;
CREATE POLICY "board_roles_select" ON public.board_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "board_roles_insert" ON public.board_roles;
CREATE POLICY "board_roles_insert" ON public.board_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE id = board_id AND creator_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "board_roles_delete" ON public.board_roles;
CREATE POLICY "board_roles_delete" ON public.board_roles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE id = board_id AND creator_user_id = auth.uid()
  )
);

-- board_bans: anyone can read, owner/mods can write
DROP POLICY IF EXISTS "board_bans_select" ON public.board_bans;
CREATE POLICY "board_bans_select" ON public.board_bans FOR SELECT USING (true);

DROP POLICY IF EXISTS "board_bans_insert" ON public.board_bans;
CREATE POLICY "board_bans_insert" ON public.board_bans FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = board_bans.board_id AND user_id = auth.uid() AND role = 'moderator')
);

DROP POLICY IF EXISTS "board_bans_delete" ON public.board_bans;
CREATE POLICY "board_bans_delete" ON public.board_bans FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = board_bans.board_id AND user_id = auth.uid() AND role = 'moderator')
);

-- board_rules: anyone can read, owner/mods can write
DROP POLICY IF EXISTS "board_rules_select" ON public.board_rules;
CREATE POLICY "board_rules_select" ON public.board_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "board_rules_insert" ON public.board_rules;
CREATE POLICY "board_rules_insert" ON public.board_rules FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = board_rules.board_id AND user_id = auth.uid() AND role = 'moderator')
);

DROP POLICY IF EXISTS "board_rules_update" ON public.board_rules;
CREATE POLICY "board_rules_update" ON public.board_rules FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = board_rules.board_id AND user_id = auth.uid() AND role = 'moderator')
);

DROP POLICY IF EXISTS "board_rules_delete" ON public.board_rules;
CREATE POLICY "board_rules_delete" ON public.board_rules FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = board_rules.board_id AND user_id = auth.uid() AND role = 'moderator')
);

-- board_mod_log: owner/mods can read, mods/system can insert
DROP POLICY IF EXISTS "board_mod_log_select" ON public.board_mod_log;
CREATE POLICY "board_mod_log_select" ON public.board_mod_log FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = board_mod_log.board_id AND user_id = auth.uid() AND role = 'moderator')
);

DROP POLICY IF EXISTS "board_mod_log_insert" ON public.board_mod_log;
CREATE POLICY "board_mod_log_insert" ON public.board_mod_log FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- post_reports: reporter can read their own, mods/owner can read all
DROP POLICY IF EXISTS "post_reports_select" ON public.post_reports;
CREATE POLICY "post_reports_select" ON public.post_reports FOR SELECT
USING (
  reporter_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = post_reports.board_id AND user_id = auth.uid() AND role = 'moderator')
);

DROP POLICY IF EXISTS "post_reports_insert" ON public.post_reports;
CREATE POLICY "post_reports_insert" ON public.post_reports FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND reporter_user_id = auth.uid());

DROP POLICY IF EXISTS "post_reports_update" ON public.post_reports;
CREATE POLICY "post_reports_update" ON public.post_reports FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = post_reports.board_id AND user_id = auth.uid() AND role = 'moderator')
);

-- Also allow owners + mods to update posts (for pin/remove)
DROP POLICY IF EXISTS "board_mods_can_update_posts" ON public.posts;
CREATE POLICY "board_mods_can_update_posts" ON public.posts FOR UPDATE
USING (
  user_id = auth.uid()
  OR (
    board_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = posts.board_id AND user_id = auth.uid() AND role = 'moderator')
    )
  )
);

-- Allow mods/owners to delete any post in their Sphera
DROP POLICY IF EXISTS "board_mods_can_delete_posts" ON public.posts;
CREATE POLICY "board_mods_can_delete_posts" ON public.posts FOR DELETE
USING (
  user_id = auth.uid()
  OR (
    board_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = posts.board_id AND user_id = auth.uid() AND role = 'moderator')
    )
  )
);

-- Allow mods/owners to remove members from board_subscriptions
DROP POLICY IF EXISTS "board_mods_can_delete_subscriptions" ON public.board_subscriptions;
CREATE POLICY "board_mods_can_delete_subscriptions" ON public.board_subscriptions FOR DELETE
USING (
  user_id = auth.uid()
  OR (
    EXISTS (SELECT 1 FROM public.boards WHERE id = board_id AND creator_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.board_roles WHERE board_id = board_subscriptions.board_id AND user_id = auth.uid() AND role = 'moderator')
  )
);

-- Also update boards: allow owner to update with helper function
DROP POLICY IF EXISTS "Allow board creators to update their own boards" ON public.boards;
CREATE POLICY "Allow board creators to update their own boards"
ON public.boards FOR UPDATE
USING (auth.uid() = creator_user_id)
WITH CHECK (auth.uid() = creator_user_id);

-- Allow board creators to delete their own boards
DROP POLICY IF EXISTS "Allow board creators to delete their own boards" ON public.boards;
CREATE POLICY "Allow board creators to delete their own boards"
ON public.boards FOR DELETE
USING (auth.uid() = creator_user_id);

NOTIFY pgrst, 'reload schema';
