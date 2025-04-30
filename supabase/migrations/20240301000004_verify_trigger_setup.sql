-- Verify trigger setup
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    trigger_schema
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'; 