-- Migration: Add temporal offset fields to relationship_templates_v2
-- Remove priority field and add temporal_offset_days and temporal_anchor_field

-- Remove priority column
ALTER TABLE relationship_templates_v2 DROP COLUMN IF EXISTS priority;

-- Add temporal offset fields
ALTER TABLE relationship_templates_v2 
ADD COLUMN temporal_offset_days INTEGER,
ADD COLUMN temporal_anchor_field TEXT;

-- Add comments for documentation
COMMENT ON COLUMN relationship_templates_v2.temporal_offset_days IS 'Number of days to offset from the anchor event. Positive for after, negative for before. NULL for immediate execution.';
COMMENT ON COLUMN relationship_templates_v2.temporal_anchor_field IS 'Field name to use as temporal anchor (e.g., first_workout_date, created_at). NULL for immediate execution.';

-- Update existing templates to use temporal system
-- Set default values for existing templates
UPDATE relationship_templates_v2 
SET 
  temporal_offset_days = 0,
  temporal_anchor_field = 'created_at'
WHERE temporal_offset_days IS NULL;

-- Add check constraint for temporal_offset_days
ALTER TABLE relationship_templates_v2 
ADD CONSTRAINT check_temporal_offset_days 
CHECK (temporal_offset_days IS NULL OR temporal_offset_days >= -365 AND temporal_offset_days <= 365);

-- Add check constraint for temporal_anchor_field
ALTER TABLE relationship_templates_v2 
ADD CONSTRAINT check_temporal_anchor_field 
CHECK (temporal_anchor_field IS NULL OR temporal_anchor_field IN (
  'created_at',
  'first_workout_date', 
  'last_workout_date',
  'birth_date',
  'start_date',
  'end_date',
  'next_renewal_date'
));
