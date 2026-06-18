-- village_market schema update for phone-based authentication

-- 1. Add phone_verified and last_login_at fields to users table if missing
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- 2. Update handle_new_auth_user function to extract NEW.phone and phone_confirmed_at
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role  user_role;
  v_name  TEXT;
  v_email TEXT;
BEGIN
  -- Extract values from user metadata
  v_name  := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User');
  v_email := NEW.email;

  -- Safely cast the role (default to 'customer' if invalid or missing)
  BEGIN
    v_role := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'customer';
  END;

  IF v_role IS NULL THEN
    v_role := 'customer';
  END IF;

  -- Insert into public.users (using phone if available, else email, else id)
  INSERT INTO public.users (id, name, phone, role, is_active, phone_verified, created_at, updated_at)
  VALUES (
    NEW.id,
    v_name,
    COALESCE(NEW.phone, v_email, NEW.id::TEXT),  -- phone: use phone, fallback to email, fallback to id
    v_role,
    TRUE,
    (NEW.phone_confirmed_at IS NOT NULL),       -- phone_verified status
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET name           = EXCLUDED.name,
        role           = EXCLUDED.role,
        phone_verified = EXCLUDED.phone_verified,
        updated_at     = NOW();

  RETURN NEW;
END;
$$;

-- 3. Drop trigger if it existed to ensure it is clean
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Re-attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
