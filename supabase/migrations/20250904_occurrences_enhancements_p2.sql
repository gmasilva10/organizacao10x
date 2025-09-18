-- Enhancements for student_occurrences: priority/sensitive restore + resolution + reminder fields
-- Idempotent migration

-- 1) Columns (IF NOT EXISTS)
ALTER TABLE IF EXISTS student_occurrences
  ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE IF EXISTS student_occurrences
  ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN;
ALTER TABLE IF EXISTS student_occurrences
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS student_occurrences
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS student_occurrences
  ADD COLUMN IF NOT EXISTS resolution_outcome TEXT;
ALTER TABLE IF EXISTS student_occurrences
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE IF EXISTS student_occurrences
  ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS student_occurrences
  ADD COLUMN IF NOT EXISTS reminder_status TEXT;
ALTER TABLE IF EXISTS student_occurrences
  ADD COLUMN IF NOT EXISTS reminder_created_by UUID REFERENCES auth.users(id);

-- 2) Defaults / checks (create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_occurrences_priority_chk'
  ) THEN
    ALTER TABLE student_occurrences
      ADD CONSTRAINT student_occurrences_priority_chk CHECK (priority IN ('low','medium','high'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_occurrences_resolution_outcome_chk'
  ) THEN
    ALTER TABLE student_occurrences
      ADD CONSTRAINT student_occurrences_resolution_outcome_chk CHECK (resolution_outcome IN ('resolved','notified','no_response','rescheduled','cancelled','other'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_occurrences_reminder_status_chk'
  ) THEN
    ALTER TABLE student_occurrences
      ADD CONSTRAINT student_occurrences_reminder_status_chk CHECK (reminder_status IN ('PENDING','DONE','CANCELLED'));
  END IF;
END$$;

ALTER TABLE IF EXISTS student_occurrences
  ALTER COLUMN priority SET DEFAULT 'medium';
ALTER TABLE IF EXISTS student_occurrences
  ALTER COLUMN is_sensitive SET DEFAULT false;
ALTER TABLE IF EXISTS student_occurrences
  ALTER COLUMN reminder_status SET DEFAULT NULL;

-- 3) Backfill priority when NULL
UPDATE student_occurrences SET priority = 'medium' WHERE priority IS NULL;
UPDATE student_occurrences SET is_sensitive = COALESCE(is_sensitive, false);

-- 4) Indexes for performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_student_occurrences_priority ON student_occurrences(priority);
CREATE INDEX IF NOT EXISTS idx_student_occurrences_sensitive ON student_occurrences(is_sensitive);
CREATE INDEX IF NOT EXISTS idx_student_occurrences_status ON student_occurrences(status);
CREATE INDEX IF NOT EXISTS idx_student_occurrences_reminder ON student_occurrences(reminder_at);
CREATE INDEX IF NOT EXISTS idx_student_occurrences_owner ON student_occurrences(owner_user_id);

