-- Drop the function and all its dependencies (including triggers)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the improved function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert into profiles with all required fields
    BEGIN
        INSERT INTO public.profiles (
            id,
            username,
            full_name,
            avatar_url,
            bio,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            NEW.email,  -- Default to email for username
            NEW.email,  -- Default to email for full_name
            NULL,       -- No avatar_url initially
            NULL,       -- No bio initially
            TIMEZONE('utc'::text, NOW()),
            TIMEZONE('utc'::text, NOW())
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
        -- Return NEW even if insert fails to avoid stopping auth signup
        RETURN NEW;
    END;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 