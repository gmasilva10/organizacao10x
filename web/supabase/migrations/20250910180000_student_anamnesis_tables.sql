-- Tabela de versões da anamnese do aluno
CREATE TABLE IF NOT EXISTS student_anamnesis_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  version_n INTEGER NOT NULL,
  answers_json JSONB NOT NULL DEFAULT '{}',
  template_version_id UUID NOT NULL REFERENCES anamnesis_templates(id),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(student_id, version_n, org_id),
  CHECK(version_n > 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_student_anamnesis_versions_student_id 
  ON student_anamnesis_versions(student_id, org_id);

CREATE INDEX IF NOT EXISTS idx_student_anamnesis_versions_created_at 
  ON student_anamnesis_versions(created_at DESC);

-- View materializada para última versão (snapshot)
CREATE TABLE IF NOT EXISTS student_anamnesis_latest (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES student_anamnesis_versions(id) ON DELETE CASCADE,
  answers_json JSONB NOT NULL DEFAULT '{}',
  active_tags TEXT[] NOT NULL DEFAULT '{}',
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY(student_id, org_id)
);

-- RLS
ALTER TABLE student_anamnesis_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_anamnesis_latest ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para student_anamnesis_versions
CREATE POLICY "Users can view anamnesis versions of their tenant students" 
  ON student_anamnesis_versions FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
    )
  );

CREATE POLICY "Users can create anamnesis versions for their tenant students" 
  ON student_anamnesis_versions FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
    )
  );

-- Políticas RLS para student_anamnesis_latest
CREATE POLICY "Users can view latest anamnesis of their tenant students" 
  ON student_anamnesis_latest FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
    )
  );

CREATE POLICY "Users can update latest anamnesis of their tenant students" 
  ON student_anamnesis_latest FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
    )
  );

-- Função para atualizar automaticamente a view materializada
CREATE OR REPLACE FUNCTION update_student_anamnesis_latest()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_anamnesis_latest (
    student_id, 
    version_id, 
    answers_json, 
    active_tags, 
    org_id, 
    updated_at
  )
  VALUES (
    NEW.student_id, 
    NEW.id, 
    NEW.answers_json, 
    '{}', -- Será preenchido pela aplicação
    NEW.org_id, 
    NOW()
  )
  ON CONFLICT (student_id, org_id) 
  DO UPDATE SET
    version_id = NEW.id,
    answers_json = NEW.answers_json,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente a view materializada
CREATE TRIGGER trigger_update_student_anamnesis_latest
  AFTER INSERT ON student_anamnesis_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_student_anamnesis_latest();

-- Comentários
COMMENT ON TABLE student_anamnesis_versions IS 'Versões históricas da anamnese do aluno';
COMMENT ON TABLE student_anamnesis_latest IS 'Snapshot da última versão da anamnese do aluno';
COMMENT ON COLUMN student_anamnesis_versions.version_n IS 'Número sequencial da versão (1, 2, 3...)';
COMMENT ON COLUMN student_anamnesis_versions.answers_json IS 'Respostas da anamnese em formato JSON';
COMMENT ON COLUMN student_anamnesis_latest.active_tags IS 'Tags ativas extraídas das respostas';
