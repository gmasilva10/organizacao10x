-- Atualizar estrutura da tabela student_responsibles para usar professional_id e roles
-- Esta migração atualiza a tabela para ser compatível com a API atual

-- Adicionar colunas necessárias
ALTER TABLE student_responsibles 
ADD COLUMN IF NOT EXISTS professional_id INTEGER REFERENCES professionals(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS note TEXT;

-- Migrar dados existentes (se houver)
-- Mapear user_id para professional_id baseado na tabela professionals
UPDATE student_responsibles 
SET professional_id = (
  SELECT p.id 
  FROM professionals p 
  WHERE p.user_id = student_responsibles.user_id 
  AND p.tenant_id = student_responsibles.tenant_id
  LIMIT 1
)
WHERE professional_id IS NULL;

-- Converter role para roles array
UPDATE student_responsibles 
SET roles = CASE 
  WHEN role = 'owner' THEN ARRAY['principal']
  WHEN role = 'trainer_primary' THEN ARRAY['principal']
  WHEN role = 'trainer_support' THEN ARRAY['apoio']
  ELSE ARRAY[role]
END
WHERE roles = '{}';

-- Remover colunas antigas (após migração)
ALTER TABLE student_responsibles 
DROP COLUMN IF EXISTS user_id,
DROP COLUMN IF EXISTS role;

-- Tornar professional_id NOT NULL
ALTER TABLE student_responsibles 
ALTER COLUMN professional_id SET NOT NULL;

-- Atualizar constraint de unicidade
DROP INDEX IF EXISTS uq_student_owner_per_student;
DROP INDEX IF EXISTS uq_student_primary_per_student;

-- Criar nova constraint de unicidade para principal por aluno
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_principal_per_student
  ON student_responsibles(student_id)
  WHERE 'principal' = ANY(roles);

-- Atualizar constraint de unicidade para professional_id + student_id + org_id
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_responsible_unique
  ON student_responsibles(org_id, student_id, professional_id);

-- Adicionar políticas RLS se não existirem
DO $$
BEGIN
  -- Política de SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_responsibles' 
    AND policyname = 'student_responsibles_select'
  ) THEN
    CREATE POLICY student_responsibles_select ON student_responsibles
      FOR SELECT
      USING (is_member_of_org(org_id));
  END IF;

  -- Política de INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_responsibles' 
    AND policyname = 'student_responsibles_insert'
  ) THEN
    CREATE POLICY student_responsibles_insert ON student_responsibles
      FOR INSERT
      WITH CHECK (is_member_of_org(org_id));
  END IF;

  -- Política de UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_responsibles' 
    AND policyname = 'student_responsibles_update'
  ) THEN
    CREATE POLICY student_responsibles_update ON student_responsibles
      FOR UPDATE
      USING (is_member_of_org(org_id))
      WITH CHECK (is_member_of_org(org_id));
  END IF;

  -- Política de DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_responsibles' 
    AND policyname = 'student_responsibles_delete'
  ) THEN
    CREATE POLICY student_responsibles_delete ON student_responsibles
      FOR DELETE
      USING (is_member_of_org(org_id));
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON TABLE student_responsibles IS 'Responsáveis pelos alunos (profissionais associados)';
COMMENT ON COLUMN student_responsibles.professional_id IS 'ID do profissional responsável';
COMMENT ON COLUMN student_responsibles.roles IS 'Array de papéis: principal, apoio, especifico';
COMMENT ON COLUMN student_responsibles.note IS 'Observações sobre o responsável';
