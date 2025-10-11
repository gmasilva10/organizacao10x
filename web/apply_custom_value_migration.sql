-- Script para aplicar migração de Valor Customizado
-- Execute este script no banco de dados quando o Docker estiver funcionando

-- Adicionar campo custom_value na tabela plans
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS custom_value boolean NOT NULL DEFAULT false;

-- Modificar constraint de valor para permitir NULL quando custom_value = true
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_valor_check;

ALTER TABLE plans 
ADD CONSTRAINT plans_valor_check 
CHECK (
  (custom_value = false AND valor > 0) OR 
  (custom_value = true AND valor IS NULL)
);

-- Índice para performance em consultas por custom_value
CREATE INDEX IF NOT EXISTS plans_custom_value_idx ON plans (custom_value);

-- Comentário para documentação
COMMENT ON COLUMN plans.custom_value IS 'Indica se o plano possui valor customizado (definido apenas no lançamento manual)';

-- Função para validar transição de custom_value
CREATE OR REPLACE FUNCTION validate_custom_value_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está desativando custom_value, valor deve ser fornecido
  IF OLD.custom_value = true AND NEW.custom_value = false THEN
    IF NEW.valor IS NULL OR NEW.valor <= 0 THEN
      RAISE EXCEPTION 'Ao desativar valor customizado, um valor válido deve ser fornecido';
    END IF;
  END IF;
  
  -- Se está ativando custom_value, valor deve ser NULL
  IF OLD.custom_value = false AND NEW.custom_value = true THEN
    NEW.valor := NULL;
    NEW.ciclo := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar transição
DROP TRIGGER IF EXISTS trigger_validate_custom_value_transition ON plans;
CREATE TRIGGER trigger_validate_custom_value_transition
  BEFORE UPDATE ON plans
  FOR EACH ROW 
  WHEN (OLD.custom_value IS DISTINCT FROM NEW.custom_value)
  EXECUTE FUNCTION validate_custom_value_transition();
