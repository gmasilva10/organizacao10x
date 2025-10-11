-- Adicionar campos category_id e tipo na tabela plans
-- Data: 2025-10-09 14:29
-- Objetivo: Vincular planos às categorias financeiras e adicionar tipo (receita/despesa)

-- Adicionar campo category_id na tabela plans
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES financial_categories(id);

-- Adicionar campo tipo na tabela plans
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS tipo text CHECK (tipo IN ('receita', 'despesa')) DEFAULT 'receita';

-- Criar índice para performance em consultas por categoria
CREATE INDEX IF NOT EXISTS plans_category_idx ON plans (category_id);

-- Criar índice para performance em consultas por tipo
CREATE INDEX IF NOT EXISTS plans_tipo_idx ON plans (tipo);

-- Comentários para documentação
COMMENT ON COLUMN plans.category_id IS 'Categoria financeira do plano';
COMMENT ON COLUMN plans.tipo IS 'Tipo financeiro: receita ou despesa';

-- Atualizar planos existentes para usar categoria "Mensalidades" por padrão
UPDATE plans 
SET category_id = (
  SELECT id 
  FROM financial_categories 
  WHERE name = 'Mensalidades' 
    AND org_id = plans.org_id 
    AND is_system = true
  LIMIT 1
)
WHERE category_id IS NULL;

-- Função para validar se categoria pertence à mesma organização
CREATE OR REPLACE FUNCTION validate_plan_category_org()
RETURNS TRIGGER AS $$
BEGIN
  -- Se category_id for fornecido, validar se pertence à mesma org
  IF NEW.category_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM financial_categories 
      WHERE id = NEW.category_id 
        AND org_id = NEW.org_id
    ) THEN
      RAISE EXCEPTION 'Category must belong to the same organization as the plan';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar categoria na mesma organização
CREATE TRIGGER trigger_validate_plan_category_org
  BEFORE INSERT OR UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION validate_plan_category_org();

-- Função para impedir exclusão de categoria se houver planos vinculados
CREATE OR REPLACE FUNCTION prevent_delete_category_with_active_plans()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM plans 
    WHERE category_id = OLD.id 
      AND ativo = true
  ) THEN
    RAISE EXCEPTION 'Cannot delete category with active plans. Deactivate plans first or change their category.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para impedir exclusão de categoria com planos ativos
CREATE TRIGGER trigger_prevent_delete_category_with_active_plans
  BEFORE DELETE ON financial_categories
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_category_with_active_plans();
