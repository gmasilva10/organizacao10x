-- Backfill de relationship_templates (MVP JSON) -> relationship_templates_v2
-- Idempotente por (org_id, code)

INSERT INTO public.relationship_templates_v2 (
  org_id, code, anchor, touchpoint, suggested_offset, channel_default,
  message_v1, message_v2, active, priority, audience_filter, variables
)
SELECT
  t.org_id,
  (t.content ->> 'code') AS code,
  (t.content ->> 'anchor') AS anchor,
  COALESCE((t.content ->> 'touchpoint'),'') AS touchpoint,
  COALESCE((t.content ->> 'suggested_offset'), '+0d') AS suggested_offset,
  COALESCE((t.content ->> 'channel_default'),'whatsapp') AS channel_default,
  COALESCE((t.content ->> 'message_v1'),'') AS message_v1,
  (t.content ->> 'message_v2') AS message_v2,
  COALESCE((t.content ->> 'active')::boolean, true) AS active,
  COALESCE((t.content ->> 'priority')::int, 0) AS priority,
  COALESCE(t.content -> 'audience_filter', '{}'::jsonb) AS audience_filter,
  COALESCE(t.content -> 'variables', '[]'::jsonb) AS variables
FROM (
  SELECT id, org_id, content::jsonb AS content
  FROM public.relationship_templates
) t
WHERE (t.content ->> 'code') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.relationship_templates_v2 v
    WHERE v.org_id = t.org_id AND v.code = (t.content ->> 'code')
  );

