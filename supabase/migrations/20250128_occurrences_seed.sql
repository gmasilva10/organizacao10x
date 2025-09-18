-- Seed inicial para grupos e tipos de ocorrências

-- Inserir grupos de ocorrências
INSERT INTO occurrence_groups (tenant_id, name, description, created_by) 
SELECT 
  t.id as tenant_id,
  'Comportamental' as name,
  'Ocorrências relacionadas ao comportamento do aluno' as description,
  (SELECT id FROM auth.users LIMIT 1) as created_by
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM occurrence_groups og WHERE og.tenant_id = t.id AND og.name = 'Comportamental'
);

INSERT INTO occurrence_groups (tenant_id, name, description, created_by) 
SELECT 
  t.id as tenant_id,
  'Acadêmico' as name,
  'Ocorrências relacionadas ao desempenho acadêmico' as description,
  (SELECT id FROM auth.users LIMIT 1) as created_by
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM occurrence_groups og WHERE og.tenant_id = t.id AND og.name = 'Acadêmico'
);

INSERT INTO occurrence_groups (tenant_id, name, description, created_by) 
SELECT 
  t.id as tenant_id,
  'Financeiro' as name,
  'Ocorrências relacionadas a pagamentos e questões financeiras' as description,
  (SELECT id FROM auth.users LIMIT 1) as created_by
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM occurrence_groups og WHERE og.tenant_id = t.id AND og.name = 'Financeiro'
);

INSERT INTO occurrence_groups (tenant_id, name, description, created_by) 
SELECT 
  t.id as tenant_id,
  'Frequência' as name,
  'Ocorrências relacionadas à frequência e presença' as description,
  (SELECT id FROM auth.users LIMIT 1) as created_by
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM occurrence_groups og WHERE og.tenant_id = t.id AND og.name = 'Frequência'
);

INSERT INTO occurrence_groups (tenant_id, name, description, created_by) 
SELECT 
  t.id as tenant_id,
  'Saúde' as name,
  'Ocorrências relacionadas à saúde do aluno' as description,
  (SELECT id FROM auth.users LIMIT 1) as created_by
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM occurrence_groups og WHERE og.tenant_id = t.id AND og.name = 'Saúde'
);

INSERT INTO occurrence_groups (tenant_id, name, description, created_by) 
SELECT 
  t.id as tenant_id,
  'Familiar' as name,
  'Ocorrências relacionadas à família do aluno' as description,
  (SELECT id FROM auth.users LIMIT 1) as created_by
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM occurrence_groups og WHERE og.tenant_id = t.id AND og.name = 'Familiar'
);

INSERT INTO occurrence_groups (tenant_id, name, description, created_by) 
SELECT 
  t.id as tenant_id,
  'Técnico' as name,
  'Ocorrências relacionadas a problemas técnicos ou operacionais' as description,
  (SELECT id FROM auth.users LIMIT 1) as created_by
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM occurrence_groups og WHERE og.tenant_id = t.id AND og.name = 'Técnico'
);

INSERT INTO occurrence_groups (tenant_id, name, description, created_by) 
SELECT 
  t.id as tenant_id,
  'Outros' as name,
  'Outras ocorrências não classificadas' as description,
  (SELECT id FROM auth.users LIMIT 1) as created_by
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM occurrence_groups og WHERE og.tenant_id = t.id AND og.name = 'Outros'
);

-- Inserir tipos de ocorrências para cada grupo
-- Comportamental
INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Agressividade' as name,
  'Comportamento agressivo com colegas ou professores' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Comportamental'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Agressividade'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Indisciplina' as name,
  'Falta de disciplina em sala de aula' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Comportamental'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Indisciplina'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Bullying' as name,
  'Prática de bullying com outros alunos' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Comportamental'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Bullying'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Vítima de Bullying' as name,
  'Aluno vítima de bullying' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Comportamental'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Vítima de Bullying'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Isolamento Social' as name,
  'Dificuldade de interação social' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Comportamental'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Isolamento Social'
);

-- Acadêmico
INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Baixo Rendimento' as name,
  'Desempenho abaixo do esperado' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Acadêmico'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Baixo Rendimento'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Dificuldade de Aprendizagem' as name,
  'Dificuldades específicas de aprendizagem' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Acadêmico'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Dificuldade de Aprendizagem'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Falta de Interesse' as name,
  'Demonstra falta de interesse nas atividades' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Acadêmico'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Falta de Interesse'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Não Entrega de Tarefas' as name,
  'Não entrega tarefas e trabalhos' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Acadêmico'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Não Entrega de Tarefas'
);

-- Financeiro
INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Atraso no Pagamento' as name,
  'Pagamento em atraso' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Financeiro'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Atraso no Pagamento'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Negociação de Valores' as name,
  'Solicitação de negociação de valores' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Financeiro'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Negociação de Valores'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Solicitação de Desconto' as name,
  'Solicitação de desconto especial' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Financeiro'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Solicitação de Desconto'
);

-- Frequência
INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Falta Excessiva' as name,
  'Muitas faltas sem justificativa' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Frequência'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Falta Excessiva'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Atrasos Frequentes' as name,
  'Chegadas atrasadas constantes' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Frequência'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Atrasos Frequentes'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Saída Antecipada' as name,
  'Saída antes do horário' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Frequência'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Saída Antecipada'
);

-- Saúde
INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Problema de Saúde' as name,
  'Problema de saúde que afeta o aprendizado' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Saúde'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Problema de Saúde'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Medicação' as name,
  'Uso de medicação que afeta o comportamento' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Saúde'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Medicação'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Alergia' as name,
  'Alergia que requer atenção especial' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Saúde'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Alergia'
);

-- Familiar
INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Problema Familiar' as name,
  'Situação familiar que afeta o aluno' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Familiar'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Problema Familiar'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Separação dos Pais' as name,
  'Separação ou divórcio dos pais' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Familiar'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Separação dos Pais'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Mudança de Endereço' as name,
  'Mudança que pode afetar a frequência' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Familiar'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Mudança de Endereço'
);

-- Técnico
INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Problema com Material' as name,
  'Problema com material didático' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Técnico'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Problema com Material'
);

INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Problema com Equipamento' as name,
  'Problema com equipamentos da escola' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Técnico'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Problema com Equipamento'
);

-- Outros
INSERT INTO occurrence_types (tenant_id, group_id, name, description, created_by)
SELECT 
  og.tenant_id,
  og.id,
  'Outros' as name,
  'Outras ocorrências não classificadas' as description,
  og.created_by
FROM occurrence_groups og
WHERE og.name = 'Outros'
AND NOT EXISTS (
  SELECT 1 FROM occurrence_types ot WHERE ot.tenant_id = og.tenant_id AND ot.group_id = og.id AND ot.name = 'Outros'
);
