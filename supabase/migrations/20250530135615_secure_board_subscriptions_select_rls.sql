-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "Allow public read access to board subscriptions" ON public.board_subscriptions;
DROP POLICY IF EXISTS "Allow users to manage their own subscriptions" ON public.board_subscriptions; -- In case old one still lingers for ALL
DROP POLICY IF EXISTS "Allow users to read their own board subscriptions" ON public.board_subscriptions;

-- Allow users to read their own subscriptions
CREATE POLICY "Allow users to read their own board subscriptions"
ON public.board_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Re-affirm other policies to be safe, ensuring they use user_id correctly.

-- Allow users to insert their own subscriptions
DROP POLICY IF EXISTS "Allow users to insert their own subscriptions" ON public.board_subscriptions;
CREATE POLICY "Allow users to insert their own subscriptions"
ON public.board_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own subscriptions (typically unsubscribe)
DROP POLICY IF EXISTS "Allow users to delete their own subscriptions" ON public.board_subscriptions;
CREATE POLICY "Allow users to delete their own subscriptions"
ON public.board_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema'; 