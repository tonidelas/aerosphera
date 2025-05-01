-- Migrate any existing posts to have default backgrounds
UPDATE posts
SET background = 'linear-gradient(135deg, #F5F9FF, #E4EFF7)'
WHERE background IS NULL;

-- Notify PostgREST to refresh schema
NOTIFY pgrst, 'reload schema'; 