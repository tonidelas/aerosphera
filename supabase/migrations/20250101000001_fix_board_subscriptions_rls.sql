-- Fix board_subscriptions RLS policies
DROP POLICY IF EXISTS "Allow users to manage their own subscriptions" ON public.board_subscriptions;
DROP POLICY IF EXISTS "Allow public read access to board subscriptions" ON public.board_subscriptions;

-- Allow users to view all subscriptions (needed for checking subscription status)
CREATE POLICY "Allow public read access to board subscriptions"
ON public.board_subscriptions
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow users to insert their own subscriptions" ON public.board_subscriptions;
-- Allow users to insert their own subscriptions
CREATE POLICY "Allow users to insert their own subscriptions"
ON public.board_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own subscriptions" ON public.board_subscriptions;
-- Allow users to update their own subscriptions
CREATE POLICY "Allow users to update their own subscriptions"
ON public.board_subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own subscriptions" ON public.board_subscriptions;
-- Allow users to delete their own subscriptions
CREATE POLICY "Allow users to delete their own subscriptions"
ON public.board_subscriptions
FOR DELETE
USING (auth.uid() = user_id); 