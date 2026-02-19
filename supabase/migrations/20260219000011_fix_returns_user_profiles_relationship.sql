-- PostgREST relationship fix: allow returns -> user_profiles join
-- Previously returns.user_id referenced auth.users, but PostgREST can't infer a join to public.user_profiles.

-- Ensure any referenced users have a user_profiles row
INSERT INTO public.user_profiles (id, is_admin, email)
SELECT DISTINCT r.user_id, false, au.email
FROM public.returns r
JOIN auth.users au ON au.id = r.user_id
LEFT JOIN public.user_profiles up ON up.id = r.user_id
WHERE up.id IS NULL;

-- Replace FK so returns.user_id directly references public.user_profiles(id)
ALTER TABLE public.returns
DROP CONSTRAINT IF EXISTS returns_user_id_fkey;

ALTER TABLE public.returns
ADD CONSTRAINT returns_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.user_profiles(id)
ON DELETE CASCADE;
