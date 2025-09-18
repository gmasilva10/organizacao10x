-- Tabela para anexos de ocorrências de alunos
CREATE TABLE IF NOT EXISTS student_occurrence_attachments (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_occurrence_id INTEGER NOT NULL REFERENCES student_occurrences(id) ON DELETE CASCADE,
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_ext TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE student_occurrence_attachments ENABLE ROW LEVEL SECURITY;

-- Política RLS para anexos
CREATE POLICY "Users can view attachments from their tenant" ON student_occurrence_attachments
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments in their tenant" ON student_occurrence_attachments
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update attachments in their tenant" ON student_occurrence_attachments
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments in their tenant" ON student_occurrence_attachments
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_occurrence_attachments_occurrence 
  ON student_occurrence_attachments(student_occurrence_id);

CREATE INDEX IF NOT EXISTS idx_occurrence_attachments_tenant 
  ON student_occurrence_attachments(tenant_id);
