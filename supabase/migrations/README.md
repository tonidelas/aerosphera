# Supabase Migrations

This directory contains SQL migrations for your Supabase project.

## Applying the latest migration

To fix the 404 error with the `get_like_counts` RPC function, you need to apply the latest migration:

1. Connect to your Supabase project via the CLI:
   ```
   supabase link --project-ref wzzenprluoldrlrzzeye
   ```

2. Apply the latest migration:
   ```
   supabase db push
   ```

Alternatively, you can apply the migration manually through the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the content of the `20240501000000_add_get_like_counts_rpc.sql` file
4. Paste it into the SQL Editor and run it

This will create the `get_like_counts` RPC function that the Feed component is trying to use. 