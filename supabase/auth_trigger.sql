-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This trigger syncs the role + name from auth.users metadata into your public users table

-- ─── Function: sync new auth user → public users table ───────────────────────
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

  -- Insert into public.users (phone is required but we don't have it at signup, use email as placeholder)
  INSERT INTO public.users (id, name, phone, role, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    v_name,
    COALESCE(v_email, NEW.id::TEXT),  -- phone placeholder: use email
    v_role,
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET name       = EXCLUDED.name,
        role       = EXCLUDED.role,
        updated_at = NOW();

  RETURN NEW;
END;
$$;

-- ─── Drop old trigger if it existed ──────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ─── Attach trigger to auth.users ─────────────────────────────────────────────
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ─── Also update existing auth users who may not be in public.users yet ──────
INSERT INTO public.users (id, name, phone, role, is_active, created_at, updated_at)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'User') AS name,
  COALESCE(au.email, au.id::TEXT) AS phone,
  CASE
    WHEN au.raw_user_meta_data->>'role' IN ('customer','shop_owner','admin')
    THEN (au.raw_user_meta_data->>'role')::user_role
    ELSE 'customer'::user_role
  END AS role,
  TRUE,
  NOW(),
  NOW()
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
ON CONFLICT (id) DO NOTHING;
