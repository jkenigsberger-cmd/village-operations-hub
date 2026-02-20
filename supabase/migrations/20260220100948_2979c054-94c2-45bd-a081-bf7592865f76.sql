
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'viewer');

-- 2. Create allowed_users table
CREATE TABLE public.allowed_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

-- 3. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Security definer function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Security definer function: is_allowed_email
CREATE OR REPLACE FUNCTION public.is_allowed_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_users
    WHERE lower(email) = lower(_email)
  )
$$;

-- 7. Trigger function for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _role app_role;
BEGIN
  _email := NEW.email;

  -- Only proceed if email is in allowed_users
  IF NOT public.is_allowed_email(_email) THEN
    RETURN NEW;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    _email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(_email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

  -- Determine role
  IF lower(_email) IN (
    'jkenigsberger@gmail.com',
    'adi@keren-hador.com',
    'gali@keren-hador.com',
    'danielle@keren-hador.com',
    'shahaf@glow-glamping.com',
    'shelly@glow-glamping.com'
  ) THEN
    _role := 'admin';
  ELSE
    _role := 'viewer';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 8. Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Seed allowed_users with the 6 power users
INSERT INTO public.allowed_users (email) VALUES
  ('jkenigsberger@gmail.com'),
  ('Adi@keren-hador.com'),
  ('gali@keren-hador.com'),
  ('danielle@keren-hador.com'),
  ('shahaf@glow-glamping.com'),
  ('shelly@glow-glamping.com');
