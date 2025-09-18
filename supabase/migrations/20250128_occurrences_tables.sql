-- Tabelas para sistema de ocorrências

-- Tabela de grupos de ocorrências
CREATE TABLE IF NOT EXISTS occurrence_groups (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(tenant_id, name)
);

-- Tabela de tipos de ocorrências
CREATE TABLE IF NOT EXISTS occurrence_types (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES occurrence_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(tenant_id, group_id, name)
);

-- Tabela de ocorrências de alunos
CREATE TABLE IF NOT EXISTS student_occurrences (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES occurrence_groups(id),
  type_id INTEGER NOT NULL REFERENCES occurrence_types(id),
  occurred_at DATE NOT NULL CHECK (occurred_at <= CURRENT_DATE),
  notes TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES professionals(id),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_sensitive BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'DONE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS para occurrence_groups
ALTER TABLE occurrence_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view occurrence groups from their tenant" ON occurrence_groups
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert occurrence groups in their tenant" ON occurrence_groups
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update occurrence groups in their tenant" ON occurrence_groups
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete occurrence groups in their tenant" ON occurrence_groups
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- RLS para occurrence_types
ALTER TABLE occurrence_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view occurrence types from their tenant" ON occurrence_types
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert occurrence types in their tenant" ON occurrence_types
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update occurrence types in their tenant" ON occurrence_types
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete occurrence types in their tenant" ON occurrence_types
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- RLS para student_occurrences
ALTER TABLE student_occurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view student occurrences from their tenant" ON student_occurrences
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert student occurrences in their tenant" ON student_occurrences
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update student occurrences in their tenant" ON student_occurrences
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete student occurrences in their tenant" ON student_occurrences
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_occurrence_groups_tenant ON occurrence_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_occurrence_types_tenant ON occurrence_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_occurrence_types_group ON occurrence_types(group_id);
CREATE INDEX IF NOT EXISTS idx_student_occurrences_tenant ON student_occurrences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_student_occurrences_student ON student_occurrences(student_id);
CREATE INDEX IF NOT EXISTS idx_student_occurrences_group ON student_occurrences(group_id);
CREATE INDEX IF NOT EXISTS idx_student_occurrences_type ON student_occurrences(type_id);
CREATE INDEX IF NOT EXISTS idx_student_occurrences_owner ON student_occurrences(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_student_occurrences_date ON student_occurrences(occurred_at DESC);
