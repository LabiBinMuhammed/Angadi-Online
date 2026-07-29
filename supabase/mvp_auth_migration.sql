-- Database migration for Angadi MVP Authentication update
-- Supports nullable phone, nullable email, and email_verified flags on public.users table

-- 1. Alter users table columns to support nullable phone and new email columns
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
-- Add unique constraint to email safely if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_key' AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END $$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- 2. Update handle_new_auth_user function to sync both email and phone
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role  user_role;
  v_name  TEXT;
  v_email TEXT;
  v_phone TEXT;
BEGIN
  -- Extract values from user metadata or native auth fields
  v_name  := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User');
  v_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
  v_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone');

  -- Safely cast the role (default to 'customer' if invalid or missing)
  BEGIN
    v_role := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'customer';
  END;

  IF v_role IS NULL THEN
    v_role := 'customer';
  END IF;

  -- Insert into public.users
  INSERT INTO public.users (
    id, 
    name, 
    phone, 
    email, 
    role, 
    is_active, 
    phone_verified, 
    email_verified, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    v_name,
    v_phone,
    v_email,
    v_role,
    TRUE,
    COALESCE(NEW.phone_confirmed_at IS NOT NULL, FALSE),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET name           = EXCLUDED.name,
        phone          = COALESCE(EXCLUDED.phone, public.users.phone),
        email          = COALESCE(EXCLUDED.email, public.users.email),
        role           = EXCLUDED.role,
        phone_verified = EXCLUDED.phone_verified,
        email_verified = EXCLUDED.email_verified,
        updated_at     = NOW();

  RETURN NEW;
END;
$$;

-- 3. Ensure trigger is attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Automatically confirm all email and phone registrations to bypass OTP verification
CREATE OR REPLACE FUNCTION public.confirm_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  NEW.phone_confirmed_at := COALESCE(NEW.phone_confirmed_at, NOW());
  NEW.confirmed_at := COALESCE(NEW.confirmed_at, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_confirm_new_auth_user ON auth.users;
CREATE TRIGGER trg_confirm_new_auth_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.confirm_new_auth_user();
