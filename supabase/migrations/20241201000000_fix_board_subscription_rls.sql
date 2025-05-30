-- Drop existing policies on board_subscriptions if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow users to read their own board subscriptions" ON public.board_subscriptions;
DROP POLICY IF EXISTS "Allow users to insert their own subscriptions" ON public.board_subscriptions;
DROP POLICY IF EXISTS "Allow users to update their own subscriptions" ON public.board_subscriptions;
DROP POLICY IF EXISTS "Allow users to delete their own subscriptions" ON public.board_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can read their own board subscriptions" ON public.board_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can insert their own subscriptions" ON public.board_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can update their own subscriptions" ON public.board_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can delete their own subscriptions" ON public.board_subscriptions;

-- Enable RLS if not already enabled (should be, based on screenshot)
ALTER TABLE public.board_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users

-- Allow authenticated users to read their own subscriptions
CREATE POLICY "Authenticated users can read their own board subscriptions"
ON public.board_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own subscriptions
-- The user_id will be automatically set to auth.uid() by default or by the client
CREATE POLICY "Authenticated users can insert their own subscriptions"
ON public.board_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own subscriptions (if needed, typically not for a join table)
-- It's often safer to handle updates as delete then insert for subscriptions.
-- If direct updates are needed, ensure the policy is correct.
-- For now, this example allows updating if they still own the subscription.
CREATE POLICY "Authenticated users can update their own subscriptions"
ON public.board_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own subscriptions
CREATE POLICY "Authenticated users can delete their own subscriptions"
ON public.board_subscriptions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Optional: If you want to allow broader read access (e.g., for public boards to show subscriber counts)
-- you might add a separate policy for SELECT TO public or anon, but that's not the current issue.
-- For example, to allow anyone to see if a subscription exists (without revealing user_id):
-- CREATE POLICY "Public can view subscription existence (by board_id)"
-- ON public.board_subscriptions
-- FOR SELECT
-- TO public, anon
-- USING (true); -- This is very permissive, adjust as needed. 