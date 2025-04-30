-- First drop the trigger that depends on the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function and all its dependencies (including triggers)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the improved function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert into profiles with explicit schema reference and error handling
    BEGIN
        INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
        VALUES (
            NEW.id,
            NEW.email,
            NEW.email,
            NOW(),
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
    END;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 