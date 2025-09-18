-- Migration: Create student_occurrence_attachments table
-- Purpose: Store file attachments for student occurrences

-- Create the attachments table
CREATE TABLE IF NOT EXISTS student_occurrence_attachments (
  id SERIAL PRIMARY KEY,
  occurrence_id INTEGER NOT NULL REFERENCES student_occurrences(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  attachment_type VARCHAR(50) DEFAULT 'general' CHECK (attachment_type IN ('general', 'resolution')),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_occurrence_attachments_occurrence_id ON student_occurrence_attachments(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_occurrence_attachments_tenant_id ON student_occurrence_attachments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_occurrence_attachments_uploaded_by ON student_occurrence_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_occurrence_attachments_type ON student_occurrence_attachments(attachment_type);

-- Enable RLS
ALTER TABLE student_occurrence_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access attachments from their tenant
CREATE POLICY "Users can access attachments from their tenant" ON student_occurrence_attachments
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Create storage bucket for occurrence attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('occurrence-attachments', 'occurrence-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can upload attachments for occurrences in their tenant
CREATE POLICY "Users can upload occurrence attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'occurrence-attachments' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM student_occurrences 
      WHERE tenant_id IN (
        SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
      )
    )
  );

-- Storage policy: Users can view attachments for occurrences in their tenant
CREATE POLICY "Users can view occurrence attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'occurrence-attachments' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM student_occurrences 
      WHERE tenant_id IN (
        SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
      )
    )
  );

-- Storage policy: Users can delete attachments for occurrences in their tenant
CREATE POLICY "Users can delete occurrence attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'occurrence-attachments' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM student_occurrences 
      WHERE tenant_id IN (
        SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
      )
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_occurrence_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_occurrence_attachments_updated_at
  BEFORE UPDATE ON student_occurrence_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_occurrence_attachments_updated_at();
