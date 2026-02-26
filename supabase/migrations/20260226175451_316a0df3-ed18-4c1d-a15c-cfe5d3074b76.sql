
-- Whitelist Danielle420902@gmail.com
INSERT INTO public.allowed_users (email)
VALUES ('Danielle420902@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Update handle_new_user to include Danielle420902 as admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _email text;
  _role app_role;
BEGIN
  _email := NEW.email;

  IF NOT public.is_allowed_email(_email) THEN
    RETURN NEW;
  END IF;

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

  IF lower(_email) IN (
    'jkenigsberger@gmail.com',
    'adi@keren-hador.com',
    'gali@keren-hador.com',
    'danielle@keren-hador.com',
    'shahaf@glow-glamping.com',
    'shelly@glow-glamping.com',
    'shir@keren-hador.com',
    'liza@kerenhador.com',
    'omrielbm@gmail.com',
    'shelly.fleischman@gmail.com',
    'gabriel@glow-glamping.com',
    'danielle420902@gmail.com'
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
$function$;
