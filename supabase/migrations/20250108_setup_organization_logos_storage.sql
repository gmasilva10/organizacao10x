-- Configurar bucket organization-logos e políticas RLS
-- Data: 2025-01-08
-- Objetivo: Configurar armazenamento seguro de logomarcas das organizações

-- Criar bucket para logomarcas das organizações
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-logos',
  'organization-logos', 
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Política para permitir visualização pública das logomarcas
CREATE POLICY "organization_logos_public_view"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-logos');

-- Política para permitir upload apenas por membros da organização
CREATE POLICY "organization_logos_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-logos' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.tenants t ON t.id = m.org_id
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = t.id::text
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
    JOIN public.tenants t ON t.id = m.org_id
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = t.id::text
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
    JOIN public.tenants t ON t.id = m.org_id
    WHERE m.user_id = auth.uid()
      AND (storage.foldername(name))[1] = t.id::text
  )
);
