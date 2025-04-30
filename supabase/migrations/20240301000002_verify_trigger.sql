-- Check all triggers in the database
SELECT 
    n.nspname as schema_name,
    t.tgname as trigger_name,
    c.relname as table_name,
    CASE t.tgenabled
        WHEN 'D' THEN 'DISABLED'
        WHEN 'O' THEN 'ORIGINAL'
        WHEN 'R' THEN 'REPLICA'
        WHEN 'A' THEN 'ALWAYS'
    END as trigger_status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgname LIKE '%auth%' OR t.tgname LIKE '%user%'
ORDER BY schema_name, trigger_name; 