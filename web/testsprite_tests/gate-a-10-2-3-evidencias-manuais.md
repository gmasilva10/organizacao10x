# EVIDÊNCIAS MANUAIS A-10.2.3 - MESSAGECOMPOSER

**Data:** 2025-01-29  
**Status:** ✅ IMPLEMENTAÇÃO CONCLUÍDA - AGUARDANDO EVIDÊNCIAS VISUAIS  
**Próximo:** Coleta manual de evidências para aceite definitivo

## 🎯 INSTRUÇÕES PARA COLETA DE EVIDÊNCIAS

### **A-10.2.3 (Composer — Alunos › Processos)**

#### **GIF A — Criar tarefa hoje 17:00**
1. **Navegar para**: `http://localhost:3000/app/students`
2. **Clicar em**: Qualquer aluno existente
3. **Abrir aba**: "Processos"
4. **Clicar em**: "Enviar Mensagem" (botão azul)
5. **No MessageComposer**:
   - Selecionar "Criar Tarefa" (radio button)
   - Clicar no campo de data/hora
   - Selecionar **HOJE** no calendário
   - Definir horário para **17:00**
   - Clicar **OK**
6. **Preencher mensagem**: "Olá [PrimeiroNome], [SaudacaoTemporal]! Como está o treino hoje?"
7. **Clicar**: "Criar Tarefa"
8. **Verificar**:
   - ✅ Toast aparece com "Ver Relacionamento"
   - ✅ Tarefa aparece em "Para Hoje" (não em Pendente)
   - ✅ Tarefa aparece no Calendário de hoje
   - ✅ Timeline do aluno registra a ação
9. **Clicar**: "Ver Relacionamento" no toast
10. **Verificar**: Deep-link abre Relacionamento global com foco no card correto

#### **GIF B — Criar tarefa amanhã 09:00**
1. **Repetir passos 1-4** do GIF A
2. **No MessageComposer**:
   - Selecionar "Criar Tarefa"
   - Clicar no campo de data/hora
   - Selecionar **AMANHÃ** no calendário
   - Definir horário para **09:00**
   - Clicar **OK**
3. **Preencher mensagem**: "Lembrete: [PrimeiroNome], seu treino é amanhã às 09:00"
4. **Clicar**: "Criar Tarefa"
5. **Verificar**:
   - ✅ Tarefa aparece em "Pendente" (não em Para Hoje)
   - ✅ Tarefa aparece no Calendário de amanhã
   - ✅ Timeline do aluno registra a ação
   - ✅ Console limpo (sem erros)

#### **GIF C — Variáveis no caret**
1. **Repetir passos 1-4** do GIF A
2. **No MessageComposer**:
   - Clicar no campo de mensagem
   - Posicionar cursor no **INÍCIO** do texto
   - Clicar em "Inserir Variáveis"
   - Selecionar categoria "Pessoal"
   - Clicar em "Inserir" ao lado de "[PrimeiroNome]"
3. **Verificar**:
   - ✅ Token [PrimeiroNome] aparece no **INÍCIO** (não no final)
   - ✅ Cursor posicionado após o token
4. **Clicar**: "Ver Prévia"
5. **Verificar**:
   - ✅ Apenas a prévia aparece (catálogo não abre junto)
   - ✅ Variáveis são resolvidas (ex: "Olá Gustavo, Bom dia!")
   - ✅ Texto mostra valores reais do aluno

#### **Print 1 — Console limpo**
1. **Abrir**: DevTools (F12)
2. **Ir para**: Console
3. **Executar**: Qualquer ação do MessageComposer
4. **Verificar**: Console sem WARN/ERROR
5. **Capturar**: Screenshot do console limpo

#### **Print 2 — DateTime picker pt-BR**
1. **Abrir**: MessageComposer
2. **Clicar**: Campo de data/hora
3. **Verificar**:
   - ✅ Calendário em português (pt-BR)
   - ✅ Botão "OK" visível
   - ✅ Enter confirma, Esc fecha
4. **Capturar**: Screenshot do calendário

### **A-10.2.2.HF1 (roles[] — Responsáveis)**

#### **GIF 1 — Principal único**
1. **Navegar para**: `http://localhost:3000/app/students`
2. **Clicar em**: Qualquer aluno
3. **Abrir aba**: "Responsáveis"
4. **Selecionar**: Treinador Principal
5. **Clicar**: "Salvar alterações"
6. **Fechar e reabrir**: Aba Responsáveis
7. **Verificar**: Treinador Principal mantido
8. **Trocar**: Para outro treinador
9. **Verificar**: Apenas um principal (anterior removido)

#### **GIF 2 — Mesmo profissional múltiplos papéis**
1. **Na aba Responsáveis**:
2. **Adicionar**: Um profissional como "Apoio"
3. **Adicionar**: O MESMO profissional como "Específico"
4. **Verificar**:
   - ✅ Apenas UM card do profissional
   - ✅ Badges mostrando "Apoio" e "Específico"
   - ✅ roles[] contém ambos os papéis
5. **Salvar e reabrir**: Verificar persistência

#### **GIF 3 — Bloqueio profissional inativo**
1. **Na aba Responsáveis**:
2. **Tentar adicionar**: Profissional inativo
3. **Verificar**:
   - ✅ Toast de erro aparece
   - ✅ Profissional inativo não é adicionado
   - ✅ Lista mostra apenas ativos

#### **Print 1 — API response com roles[]**
1. **Abrir**: DevTools → Network
2. **Filtrar**: XHR/Fetch
3. **Abrir**: Aba Responsáveis
4. **Capturar**: Resposta do GET /api/students/:id/responsibles
5. **Verificar**: Estrutura com roles: [...]

#### **Print 2 — RLS cross-tenant**
1. **Tentar acessar**: Dados de outro tenant
2. **Verificar**: Resposta 403/404
3. **Capturar**: Screenshot do erro

#### **Print 3 — EXPLAIN ANALYZE**
1. **Executar**: Query no banco
2. **Verificar**: Índices em uso
3. **Capturar**: Resultado do EXPLAIN

## 📋 CHECKLIST DE VALIDAÇÃO

### **Composer**
- [ ] Variáveis [entre colchetes]
- [ ] Inserção no caret (posição do cursor)
- [ ] Ver prévia = somente prévia (catálogo não abre)
- [ ] Catálogo abaixo do texto (não cobrindo)
- [ ] DateTime pt-BR com OK
- [ ] Sem "Invalid time value"
- [ ] Textos legados removidos

### **Reflexos**
- [ ] Hoje → Para Hoje (exclusivo)
- [ ] Futuro → Pendente
- [ ] Calendário correto
- [ ] Timeline registra
- [ ] Deep-link foca card correto
- [ ] RLS ativa
- [ ] Console limpo

### **Responsáveis**
- [ ] Principal único
- [ ] Mesmo profissional múltiplos papéis
- [ ] Bloqueio inativo
- [ ] roles[] estrutura
- [ ] RLS cross-tenant
- [ ] Performance otimizada

## 🎯 PRÓXIMOS PASSOS

1. **Coletar todas as evidências** conforme instruções acima
2. **Organizar em pastas**:
   - `gifs/` - Todos os GIFs
   - `prints/` - Todos os prints
3. **Atualizar relatórios**:
   - `gate-a-10-2-3-composer-processos.md`
   - `gate-a-10-2-2-responsaveis.md`
4. **Atualizar** `Atividades.txt`
5. **Enviar para aceite definitivo** do GP

---

**Status**: ✅ IMPLEMENTAÇÃO CONCLUÍDA  
**Aguardando**: Evidências visuais para aceite definitivo  
**Próximo**: A-10.2.4 - Listagem & QA UX (P1)
