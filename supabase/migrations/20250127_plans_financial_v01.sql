-- PR-S2: Planos + Financeiro do Aluno v0.1
-- Migration: 20250127_plans_financial_v01.sql
-- Description: Create plans, student_plan_contracts and student_billing tables following DEV specification

-- Plans table (seguindo especificação do DEV)
CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code text NOT NULL,
  nome text NOT NULL,
  descricao text,
  valor numeric(12,2) NOT NULL CHECK (valor > 0),
  moeda char(3) NOT NULL DEFAULT 'BRL',
  ciclo text CHECK (ciclo IN ('mensal','trimestral','semestral','anual')),
  duracao_em_ciclos int CHECK (duracao_em_ciclos > 0),
  ativo boolean NOT NULL DEFAULT true,
  tenant_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for plan_code per tenant
CREATE UNIQUE INDEX plans_tenant_plan_code_idx ON plans (tenant_id, plan_code);

-- Index for active plans per tenant
CREATE INDEX plans_tenant_active_idx ON plans (tenant_id, ativo);

-- Student plan contracts table (contratos/vendas do aluno)
CREATE TABLE student_plan_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  plan_code text NOT NULL,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price > 0),
  currency char(3) NOT NULL DEFAULT 'BRL',
  cycle text CHECK (cycle IN ('mensal','trimestral','semestral','anual')),
  duration_cycles int CHECK (duration_cycles > 0),
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','encerrado','cancelado')),
  renewed_from_id uuid REFERENCES student_plan_contracts(id),
  notes text,
  tenant_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: 1 contrato ativo por student_id + plan_code
CREATE UNIQUE INDEX student_plan_contracts_active_unique_idx 
ON student_plan_contracts (student_id, plan_code) 
WHERE status = 'ativo';

-- Index for contracts per tenant and student
CREATE INDEX student_plan_contracts_tenant_student_idx ON student_plan_contracts (tenant_id, student_id);

-- Index for active contracts per tenant
CREATE INDEX student_plan_contracts_tenant_active_idx ON student_plan_contracts (tenant_id, status);

-- Student billing table (pré-lançamentos)
CREATE TABLE student_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  contract_id uuid NOT NULL REFERENCES student_plan_contracts(id) ON DELETE CASCADE,
  plan_code text NOT NULL,
  competencia text NOT NULL, -- AAAAMM format
  valor numeric(12,2) NOT NULL CHECK (valor > 0),
  moeda char(3) NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','cancelado')),
  created_by uuid,
  tenant_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for billing per tenant and student
CREATE INDEX student_billing_tenant_student_idx ON student_billing (tenant_id, student_id);

-- Index for billing per contract
CREATE INDEX student_billing_contract_idx ON student_billing (contract_id);

-- Index for billing per competencia
CREATE INDEX student_billing_competencia_idx ON student_billing (competencia);

-- Enable RLS on all tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_plan_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_billing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plans
CREATE POLICY "Users can view plans from their organization" ON plans
  FOR SELECT USING (tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admin/Manager can insert plans" ON plans
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can update plans" ON plans
  FOR UPDATE USING (
    tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can delete plans" ON plans
  FOR DELETE USING (
    tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- RLS Policies for student_plan_contracts
CREATE POLICY "Users can view contracts from their organization" ON student_plan_contracts
  FOR SELECT USING (tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admin/Manager can insert contracts" ON student_plan_contracts
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can update contracts" ON student_plan_contracts
  FOR UPDATE USING (
    tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can delete contracts" ON student_plan_contracts
  FOR DELETE USING (
    tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- RLS Policies for student_billing
CREATE POLICY "Users can view billing from their organization" ON student_billing
  FOR SELECT USING (tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admin/Manager can insert billing" ON student_billing
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can update billing" ON student_billing
  FOR UPDATE USING (
    tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin/Manager can delete billing" ON student_billing
  FOR DELETE USING (
    tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_plan_contracts_updated_at BEFORE UPDATE ON student_plan_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_billing_updated_at BEFORE UPDATE ON student_billing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
