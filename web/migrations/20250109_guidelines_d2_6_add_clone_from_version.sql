-- Adicionar coluna clone_from_version para auditoria de correção de versões
ALTER TABLE guidelines_versions
ADD COLUMN clone_from_version UUID REFERENCES guidelines_versions(id);

-- Comentário explicativo
COMMENT ON COLUMN guidelines_versions.clone_from_version IS 'ID da versão original quando esta versão foi criada via correção';
