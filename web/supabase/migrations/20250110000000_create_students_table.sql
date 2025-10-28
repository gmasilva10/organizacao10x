-- Tabela de alunos
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'active', 'paused', 'inactive')),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_students_org_id ON students(org_id);
CREATE INDEX IF NOT EXISTS idx_students_trainer_id ON students(trainer_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);

-- RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view students of their tenant" 
  ON students FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
    )
  );

CREATE POLICY "Users can create students in their tenant" 
  ON students FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
    )
  );

CREATE POLICY "Users can update students of their tenant" 
  ON students FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
    )
  );

CREATE POLICY "Users can delete students of their tenant" 
  ON students FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE students IS 'Tabela de alunos do sistema';
COMMENT ON COLUMN students.status IS 'Status do aluno: onboarding, active, paused, inactive';
COMMENT ON COLUMN students.trainer_id IS 'ID do treinador responsável pelo aluno';
