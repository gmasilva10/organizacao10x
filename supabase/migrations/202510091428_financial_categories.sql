-- Implementar sistema de categorias financeiras
-- Data: 2025-10-09 14:28
-- Objetivo: Criar tabela financial_categories com RLS e categoria padrão "Mensalidades"

-- Criar tabela financial_categories
CREATE TABLE financial_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL, -- hex color (#RRGGBB)
  active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false, -- true para categoria padrão "Mensalidades"
  org_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE UNIQUE INDEX financial_categories_org_name_idx ON financial_categories (org_id, lower(name));
CREATE INDEX financial_categories_org_active_idx ON financial_categories (org_id, active);
CREATE INDEX financial_categories_org_system_idx ON financial_categories (org_id, is_system);

-- Enable RLS
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies - seguindo padrão das outras tabelas
CREATE POLICY "Users can view financial categories from their organization" ON financial_categories
  FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admin/Manager can insert financial categories" ON financial_categories
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can update financial categories" ON financial_categories
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can delete financial categories" ON financial_categories
  FOR DELETE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager') AND
    is_system = false -- Não permitir deletar categoria do sistema
  );

-- Trigger para updated_at
CREATE TRIGGER update_financial_categories_updated_at BEFORE UPDATE ON financial_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE financial_categories IS 'Categorias financeiras para organização de planos e serviços';
COMMENT ON COLUMN financial_categories.name IS 'Nome da categoria (ex: Mensalidades, Personal Trainer)';
COMMENT ON COLUMN financial_categories.color IS 'Cor hex da categoria para UI (#RRGGBB)';
COMMENT ON COLUMN financial_categories.is_system IS 'Categoria do sistema que não pode ser deletada';
COMMENT ON COLUMN financial_categories.org_id IS 'Organização proprietária da categoria';

-- Inserir categoria padrão "Mensalidades" para todas as organizações existentes
INSERT INTO financial_categories (name, color, active, is_system, org_id)
SELECT 
  'Mensalidades',
  '#3B82F6', -- blue-500
  true,
  true,
  org_id
FROM tenants
WHERE org_id NOT IN (
  SELECT org_id FROM financial_categories WHERE name = 'Mensalidades'
);

-- Função para criar categoria padrão automaticamente em novas organizações
CREATE OR REPLACE FUNCTION create_default_financial_category()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO financial_categories (name, color, active, is_system, org_id)
  VALUES ('Mensalidades', '#3B82F6', true, true, NEW.org_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar categoria padrão quando nova organização for criada
CREATE TRIGGER trigger_create_default_financial_category
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_default_financial_category();

-- Função para validar cor hex
CREATE OR REPLACE FUNCTION validate_hex_color(color text)
RETURNS boolean AS $$
BEGIN
  RETURN color ~ '^#[0-9A-Fa-f]{6}$';
END;
$$ LANGUAGE plpgsql;

-- Constraint para validar formato da cor
ALTER TABLE financial_categories 
ADD CONSTRAINT check_color_format 
CHECK (validate_hex_color(color));

-- Função para impedir exclusão de categoria com planos vinculados
CREATE OR REPLACE FUNCTION prevent_delete_category_with_plans()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM plans 
    WHERE category_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Cannot delete category with linked plans. Deactivate instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_delete_category_with_plans
  BEFORE DELETE ON financial_categories
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_category_with_plans();
