/**
 * GATE 10.9 - Integração Hotmart
 * 
 * Tabelas:
 * 1. hotmart_integrations - Credenciais por organização
 * 2. hotmart_product_mappings - Mapeamento produto → plano
 * 3. hotmart_transactions - Log de todas as transações
 */

-- ============================================================================
-- 1. TABELA: hotmart_integrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hotmart_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Credenciais (criptografar em produção)
  client_id VARCHAR(255) NOT NULL,
  client_secret VARCHAR(255) NOT NULL,
  basic_token VARCHAR(255) NOT NULL,
  
  -- OAuth Token (cache para API REST)
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_sync TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id) -- Uma integração Hotmart por organização
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_hotmart_integrations_org 
  ON public.hotmart_integrations(org_id);

CREATE INDEX IF NOT EXISTS idx_hotmart_integrations_basic_token 
  ON public.hotmart_integrations(basic_token);

-- RLS Policies
ALTER TABLE public.hotmart_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view own Hotmart integration"
  ON public.hotmart_integrations
  FOR SELECT
  USING (org_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY "Organizations can insert own Hotmart integration"
  ON public.hotmart_integrations
  FOR INSERT
  WITH CHECK (org_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY "Organizations can update own Hotmart integration"
  ON public.hotmart_integrations
  FOR UPDATE
  USING (org_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY "Organizations can delete own Hotmart integration"
  ON public.hotmart_integrations
  FOR DELETE
  USING (org_id = current_setting('app.current_org_id')::UUID);


-- ============================================================================
-- 2. TABELA: hotmart_product_mappings
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hotmart_product_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Produto Hotmart
  hotmart_product_id BIGINT NOT NULL,
  hotmart_product_name VARCHAR(255),
  hotmart_product_ucode VARCHAR(100),
  
  -- Plano Interno
  internal_plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  
  -- Configurações de automação
  auto_create_student BOOLEAN DEFAULT TRUE,
  auto_activate BOOLEAN DEFAULT TRUE,
  trigger_onboarding BOOLEAN DEFAULT TRUE,
  send_welcome_email BOOLEAN DEFAULT TRUE,
  send_welcome_whatsapp BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, hotmart_product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_hotmart_mappings_org 
  ON public.hotmart_product_mappings(org_id);

CREATE INDEX IF NOT EXISTS idx_hotmart_mappings_product 
  ON public.hotmart_product_mappings(hotmart_product_id);

CREATE INDEX IF NOT EXISTS idx_hotmart_mappings_plan 
  ON public.hotmart_product_mappings(internal_plan_id);

-- RLS Policies
ALTER TABLE public.hotmart_product_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can manage own Hotmart mappings"
  ON public.hotmart_product_mappings
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::UUID);


-- ============================================================================
-- 3. TABELA: hotmart_transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hotmart_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  
  -- Identificadores Hotmart
  hotmart_transaction_id VARCHAR(100) UNIQUE NOT NULL,
  hotmart_order_ref VARCHAR(100),
  hotmart_subscriber_code VARCHAR(100),
  
  -- Evento
  event_type VARCHAR(50) NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  
  -- Produto
  product_id BIGINT,
  product_name VARCHAR(255),
  product_ucode VARCHAR(100),
  
  -- Comprador
  buyer_name VARCHAR(255),
  buyer_email VARCHAR(255),
  buyer_phone VARCHAR(50),
  buyer_document VARCHAR(50),
  
  -- Valores
  currency VARCHAR(3) DEFAULT 'BRL',
  gross_value DECIMAL(10,2),
  net_value DECIMAL(10,2),
  
  -- Pagamento
  payment_type VARCHAR(50),
  installments INT,
  
  -- Assinatura (se aplicável)
  subscription_status VARCHAR(50),
  subscription_plan VARCHAR(100),
  
  -- Processamento
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  
  -- Payload completo (auditoria)
  raw_payload JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_hotmart_transactions_org_student 
  ON public.hotmart_transactions(org_id, student_id);

CREATE INDEX IF NOT EXISTS idx_hotmart_transactions_event 
  ON public.hotmart_transactions(event_type, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_hotmart_transactions_processed 
  ON public.hotmart_transactions(processed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hotmart_transactions_order_ref 
  ON public.hotmart_transactions(hotmart_order_ref);

-- RLS Policies
ALTER TABLE public.hotmart_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view own Hotmart transactions"
  ON public.hotmart_transactions
  FOR SELECT
  USING (org_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY "Service role can insert Hotmart transactions"
  ON public.hotmart_transactions
  FOR INSERT
  WITH CHECK (TRUE); -- Webhook usa service role

CREATE POLICY "Organizations can update own Hotmart transactions"
  ON public.hotmart_transactions
  FOR UPDATE
  USING (org_id = current_setting('app.current_org_id')::UUID);


-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE public.hotmart_integrations IS 'Credenciais Hotmart por organização (multi-tenant)';
COMMENT ON TABLE public.hotmart_product_mappings IS 'Mapeamento de produtos Hotmart para PLANOS DE VENDA internos (tabela plans)';
COMMENT ON TABLE public.hotmart_transactions IS 'Log de todas as transações/eventos recebidos da Hotmart';

-- IMPORTANTE: Diferença entre service_catalog e plans
-- service_catalog = Catálogo de serviços oferecidos (ex: Personal Trainer, Avaliação Física)
-- plans = Planos de VENDA/comercialização (ex: Mensal R$ 199, Trimestral R$ 499)
-- Integração Hotmart mapeia para PLANS (produtos que o cliente compra)

COMMENT ON COLUMN public.hotmart_integrations.basic_token IS 'Token usado para validar webhooks (X-Hotmart-Hottok header)';
COMMENT ON COLUMN public.hotmart_product_mappings.auto_create_student IS 'Se TRUE, cria aluno automaticamente ao receber PURCHASE_APPROVED';
COMMENT ON COLUMN public.hotmart_transactions.processed IS 'Se TRUE, o evento já foi processado (criar aluno, vincular plano, etc.)';
COMMENT ON COLUMN public.hotmart_transactions.raw_payload IS 'Payload completo do webhook para auditoria e debug';
