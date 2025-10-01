-- relationship_templates_v2: schema estruturado para templates
-- Idempotente

CREATE TABLE IF NOT EXISTS public.relationship_templates_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  code text NOT NULL,
  anchor text NOT NULL CHECK (anchor IN (
    'sale_close','first_workout','weekly_followup','monthly_review','birthday','renewal_window','occurrence_followup','manual'
  )),
  touchpoint text NOT NULL,
  suggested_offset text NOT NULL,
  channel_default text NOT NULL CHECK (channel_default IN ('whatsapp','email','manual')),
  message_v1 text NOT NULL,
  message_v2 text NULL,
  active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  audience_filter jsonb NOT NULL DEFAULT '{}',
  variables jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_rt_v2_tenant ON public.relationship_templates_v2(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rt_v2_active ON public.relationship_templates_v2(active);
CREATE INDEX IF NOT EXISTS idx_rt_v2_anchor ON public.relationship_templates_v2(anchor);
CREATE INDEX IF NOT EXISTS idx_rt_v2_priority ON public.relationship_templates_v2(priority);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.set_rt_v2_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'trg_rt_v2_updated_at') THEN
    CREATE TRIGGER trg_rt_v2_updated_at BEFORE UPDATE ON public.relationship_templates_v2
    FOR EACH ROW EXECUTE FUNCTION public.set_rt_v2_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE public.relationship_templates_v2 ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'rt_v2_select_policy'
  ) THEN
    CREATE POLICY rt_v2_select_policy ON public.relationship_templates_v2
      FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'rt_v2_insert_policy'
  ) THEN
    CREATE POLICY rt_v2_insert_policy ON public.relationship_templates_v2
      FOR INSERT WITH CHECK (
        tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'rt_v2_update_policy'
  ) THEN
    CREATE POLICY rt_v2_update_policy ON public.relationship_templates_v2
      FOR UPDATE USING (
        tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'rt_v2_delete_policy'
  ) THEN
    CREATE POLICY rt_v2_delete_policy ON public.relationship_templates_v2
      FOR DELETE USING (
        tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid())
      );
  END IF;
END $$;

