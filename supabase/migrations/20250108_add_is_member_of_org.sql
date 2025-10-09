-- Helper RLS: is_member_of_org(org uuid)
-- Retorna TRUE quando o usuário autenticado pertence à organização

CREATE OR REPLACE FUNCTION public.is_member_of_org(p_org uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = p_org
      AND m.user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.is_member_of_org(uuid)
IS 'RLS helper: TRUE quando auth.uid() está na public.memberships para org_id informado';


