-- Corrigir políticas RLS do Storage para organization-logos
-- Data: 2025-01-08
-- Objetivo: Corrigir políticas que estavam usando storage.foldername(t.name) incorretamente

-- Remover políticas antigas
DROP POLICY IF EXISTS "organization_logos_upload" ON storage.objects;
DROP POLICY IF EXISTS "organization_logos_update" ON storage.objects;
DROP POLICY IF EXISTS "organization_logos_delete" ON storage.objects;

-- Política para permitir upload apenas por membros da organização
-- Verifica se o primeiro nível do path (org_id) corresponde à organização do usuário
CREATE POLICY "organization_logos_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-logos' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.org_id::text
  )
);

-- Política para permitir atualização apenas por membros da organização
CREATE POLICY "organization_logos_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organization-logos' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.org_id::text
  )
);

-- Política para permitir exclusão apenas por membros da organização
CREATE POLICY "organization_logos_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organization-logos' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.org_id::text
  )
);
