-- Tabela para estatísticas do job de relacionamento
CREATE TABLE IF NOT EXISTS relationship_job_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER NOT NULL,
  strategies_executed INTEGER NOT NULL DEFAULT 0,
  strategies_failed INTEGER NOT NULL DEFAULT 0,
  templates_processed INTEGER NOT NULL DEFAULT 0,
  students_found INTEGER NOT NULL DEFAULT 0,
  tasks_created INTEGER NOT NULL DEFAULT 0,
  tasks_updated INTEGER NOT NULL DEFAULT 0,
  tasks_skipped INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  by_strategy JSONB NOT NULL DEFAULT '{}',
  cache_hits INTEGER NOT NULL DEFAULT 0,
  cache_misses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_relationship_job_stats_org_id ON relationship_job_stats(org_id);
CREATE INDEX IF NOT EXISTS idx_relationship_job_stats_start_time ON relationship_job_stats(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_relationship_job_stats_org_start ON relationship_job_stats(org_id, start_time DESC);

-- RLS
ALTER TABLE relationship_job_stats ENABLE ROW LEVEL SECURITY;

-- Política para usuários da organização
CREATE POLICY "Users can view job stats from their organization" ON relationship_job_stats
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Política para service role (jobs internos)
CREATE POLICY "Service role can manage job stats" ON relationship_job_stats
  FOR ALL USING (true);

-- Função para limpeza automática de estatísticas antigas (manter apenas 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_job_stats()
RETURNS void AS $$
BEGIN
  DELETE FROM relationship_job_stats 
  WHERE start_time < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE relationship_job_stats IS 'Estatísticas de execução do job de relacionamento';
COMMENT ON COLUMN relationship_job_stats.by_strategy IS 'Estatísticas detalhadas por estratégia de âncora';
COMMENT ON COLUMN relationship_job_stats.cache_hits IS 'Número de hits no cache durante a execução';
COMMENT ON COLUMN relationship_job_stats.cache_misses IS 'Número de misses no cache durante a execução';
