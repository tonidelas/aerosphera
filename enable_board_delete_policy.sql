-- ============================================================
-- SPHERAS SYSTEM FIX — Run this in Supabase SQL Editor
-- ============================================================

-- 1. Delete all orphaned Spheras (no owner)
DELETE FROM public.boards WHERE creator_user_id IS NULL;

-- 2. Enable RLS DELETE policy so creators can delete their own Spheras
DROP POLICY IF EXISTS "Allow board creators to delete their own boards" ON public.boards;
CREATE POLICY "Allow board creators to delete their own boards"
ON public.boards
FOR DELETE
USING (auth.uid() = creator_user_id);

-- 3. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
