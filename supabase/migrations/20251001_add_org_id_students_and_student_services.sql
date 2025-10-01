-- Migration: Add org_id to students and student_services (compat with tenant_id)
-- Date: 2025-10-01
-- Description: Introduz coluna org_id, realiza backfill a partir de tenant_id e cria índices.

BEGIN;

-- 1) Add columns if not exists
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE public.student_services ADD COLUMN IF NOT EXISTS org_id uuid;

-- 2) Backfill from existing tenant_id
UPDATE public.students SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE public.student_services SET org_id = tenant_id WHERE org_id IS NULL;

-- 3) Indexes to support common filters
CREATE INDEX IF NOT EXISTS idx_students_org_id ON public.students(org_id);
CREATE INDEX IF NOT EXISTS idx_student_services_org_id ON public.student_services(org_id);

COMMIT;


