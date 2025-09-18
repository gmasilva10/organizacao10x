-- GATE 1: occurrence_types.applies_to (student|professional|both) + índices + backfill
-- Idempotente

-- 1) Adicionar coluna se não existir
ALTER TABLE IF EXISTS occurrence_types
  ADD COLUMN IF NOT EXISTS applies_to TEXT;

-- 2) Definir default e backfill
ALTER TABLE IF EXISTS occurrence_types
  ALTER COLUMN applies_to SET DEFAULT 'student';

UPDATE occurrence_types
SET applies_to = 'student'
WHERE applies_to IS NULL;

-- 3) Constraint de valores permitidos (create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'occurrence_types_applies_to_chk'
  ) THEN
    ALTER TABLE occurrence_types
      ADD CONSTRAINT occurrence_types_applies_to_chk
      CHECK (applies_to IN ('student','professional','both'));
  END IF;
END$$;

-- 4) Not null
ALTER TABLE IF EXISTS occurrence_types
  ALTER COLUMN applies_to SET NOT NULL;

-- 5) Índices recomendados
CREATE INDEX IF NOT EXISTS idx_occurrence_types_applies_to
  ON occurrence_types (tenant_id, applies_to, is_active);

CREATE INDEX IF NOT EXISTS idx_occurrence_types_group
  ON occurrence_types (tenant_id, group_id, is_active);


