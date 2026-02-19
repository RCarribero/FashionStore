-- Add email to user_profiles (used across admin/returns UI)

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email text;

-- Backfill email from auth.users
UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE au.id = up.id
  AND (up.email IS NULL OR up.email = '');

-- Ensure new users get email populated
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into public.user_profiles (id, is_admin, email)
  values (new.id, false, new.email)
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;
