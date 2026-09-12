INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role FROM public.profiles WHERE email = 'rauf.mirzayee@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;