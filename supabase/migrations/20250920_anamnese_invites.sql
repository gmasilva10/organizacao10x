-- Migration: 20250920_anamnese_invites.sql
-- Description: Create anamnese_invites table for secure token-based anamnesis process

-- Tabela de convites de anamnese
CREATE TABLE anamnese_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'submitted', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  sent_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz,
  submitted_at timestamptz,
  phone text NOT NULL, -- Telefone normalizado E.164
  message_sent text, -- Mensagem enviada via WhatsApp
  tenant_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX anamnese_invites_token_idx ON anamnese_invites (token);
CREATE INDEX anamnese_invites_student_id_idx ON anamnese_invites (student_id);
CREATE INDEX anamnese_invites_status_idx ON anamnese_invites (status);
CREATE INDEX anamnese_invites_expires_at_idx ON anamnese_invites (expires_at);
CREATE INDEX anamnese_invites_tenant_id_idx ON anamnese_invites (tenant_id);

-- RLS habilitado
ALTER TABLE anamnese_invites ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários só veem convites da sua organização
CREATE POLICY anamnese_invites_tenant_policy ON anamnese_invites
  USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Tabela de respostas de anamnese
CREATE TABLE anamnese_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES anamnese_invites(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  responses jsonb NOT NULL, -- Respostas do formulário
  calculated_data jsonb, -- Dados calculados pelo motor
  pdf_url text, -- URL do PDF gerado
  pdf_hash text, -- Hash do commit para rastreabilidade
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'processed', 'error')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  tenant_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX anamnese_responses_invite_id_idx ON anamnese_responses (invite_id);
CREATE INDEX anamnese_responses_student_id_idx ON anamnese_responses (student_id);
CREATE INDEX anamnese_responses_status_idx ON anamnese_responses (status);
CREATE INDEX anamnese_responses_tenant_id_idx ON anamnese_responses (tenant_id);

-- RLS habilitado
ALTER TABLE anamnese_responses ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários só veem respostas da sua organização
CREATE POLICY anamnese_responses_tenant_policy ON anamnese_responses
  USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Função para gerar token único
CREATE OR REPLACE FUNCTION generate_anamnese_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Função para limpar convites expirados
CREATE OR REPLACE FUNCTION cleanup_expired_anamnese_invites()
RETURNS void AS $$
BEGIN
  UPDATE anamnese_invites 
  SET status = 'expired' 
  WHERE status IN ('sent', 'opened') 
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE anamnese_invites IS 'Convites de anamnese com tokens seguros para acesso público';
COMMENT ON TABLE anamnese_responses IS 'Respostas de anamnese dos alunos';
COMMENT ON COLUMN anamnese_invites.token IS 'Token único para acesso público ao formulário';
COMMENT ON COLUMN anamnese_invites.phone IS 'Telefone normalizado E.164 para envio via WhatsApp';
COMMENT ON COLUMN anamnese_responses.responses IS 'Respostas do formulário em formato JSON';
COMMENT ON COLUMN anamnese_responses.calculated_data IS 'Dados calculados pelo motor de anamnese';
COMMENT ON COLUMN anamnese_responses.pdf_hash IS 'Hash do commit para rastreabilidade do PDF';
