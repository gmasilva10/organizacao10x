# Guia para Coleta Manual de Evidências - A-10.2.3 & A-10.2.2.HF1

## 🎯 **A-10.2.3 — Evidências Visuais Obrigatórias**

### **GIF A — Criar tarefa hoje 17:00**

**Passos para gravação:**
1. Navegar para `http://localhost:3000/app/students`
2. Selecionar aluno "Maria Silva Santos" 
3. Clicar no botão "Processos" no dropdown "Anexos"
4. No MessageComposer:
   - Selecionar "Criar Tarefa" (não "Enviar Agora")
   - Definir data para HOJE às 17:00
   - Mensagem: `Olá [PrimeiroNome], [SaudacaoTemporal]! Como está o treino hoje?`
   - Clicar "Criar Tarefa"
5. Verificar toast com botão "Ver Relacionamento"
6. Clicar no botão "Ver Relacionamento" no toast
7. Verificar que abre tela global do relacionamento com:
   - Task focada corretamente (`focusTaskId`)
   - Aparece na coluna "Para Hoje" (não duplica em "Pendente")
   - Aparece no Calendário de hoje
   - Registra na Timeline do aluno

**Resultado esperado:**
- ✅ Tarefa entra imediato em "Para Hoje" (exclusivo, sem duplicar em "Pendente")
- ✅ Aparece no Calendário de hoje
- ✅ Registra na Timeline do aluno
- ✅ Deep-link funciona com `focusTaskId` e período correto

---

### **GIF B — Criar tarefa amanhã 09:00**

**Passos para gravação:**
1. Abrir MessageComposer novamente
2. No MessageComposer:
   - Selecionar "Criar Tarefa"
   - Definir data para AMANHÃ às 09:00
   - Mensagem: `Lembrete: [PrimeiroNome], seu treino está agendado para [DataHoje] às 09:00.`
   - Clicar "Criar Tarefa"
3. Verificar que tarefa aparece:
   - Na coluna "Pendente"
   - No Calendário na data de amanhã
   - Na Timeline registra imediatamente
4. Verificar console limpo (F12 → Console → sem WARN/ERROR)

**Resultado esperado:**
- ✅ Tarefa aparece em "Pendente"
- ✅ Aparece no Calendário na data de amanhã
- ✅ Timeline registra imediatamente
- ✅ Console limpo (zero WARN/ERROR)

---

### **GIF C — Variáveis no caret**

**Passos para gravação:**
1. Abrir MessageComposer novamente
2. No campo de mensagem, posicionar cursor NO INÍCIO do texto
3. Clicar em "Inserir Variáveis"
4. Selecionar categoria "Pessoal"
5. Clicar em "Inserir" na variável `[PrimeiroNome]`
6. Verificar que:
   - Token `[PrimeiroNome]` é inserido NA POSIÇÃO DO CURSOR (início)
   - Cursor fica posicionado após o token inserido
7. Clicar em "Ver Prévia"
8. Verificar que:
   - Prévia mostra mensagem com variáveis resolvidas
   - Catálogo de variáveis NÃO abre junto com a prévia
   - `[PrimeiroNome]` é resolvido para "Maria"

**Resultado esperado:**
- ✅ Token inserido na posição exata do cursor (não no final)
- ✅ Formato sempre `[EntreColchetes]`
- ✅ Prévia exibe variáveis resolvidas
- ✅ Catálogo não abre quando clica em "Ver Prévia"

---

### **PRINTS (2)**

#### **Print 1: Console Limpo**
1. Abrir F12 → Console
2. Realizar as ações do GIF A e B
3. Capturar print do console mostrando zero WARN/ERROR
4. Salvar como: `console-limpo-composer-atualizacoes.png`

#### **Print 2: DateTime Picker pt-BR**
1. Abrir MessageComposer
2. Selecionar "Criar Tarefa"
3. Clicar no seletor de data
4. Capturar print mostrando:
   - Calendário em português brasileiro
   - Botões "Hoje", "Limpar", "Cancelar" e "OK" visíveis
   - Input de time com formato HH:mm
5. Salvar como: `datetime-picker-pt-br-ok.png`

---

## 🎯 **A-10.2.2.HF1 (roles[]) — Evidências Pendentes**

### **GIF 1: Principal único**

**Passos para gravação:**
1. Navegar para aba "Responsáveis" do aluno
2. Selecionar um profissional como "Treinador Principal"
3. Salvar alterações
4. Trocar para outro profissional como "Treinador Principal"
5. Verificar que o anterior é removido (principal único)
6. Salvar e reabrir a aba para verificar persistência

**Resultado esperado:**
- ✅ Apenas um principal por vez
- ✅ Troca funciona corretamente
- ✅ Persistência ao reabrir

---

### **GIF 2: Mesmo profissional múltiplos papéis**

**Passos para gravação:**
1. Selecionar um profissional como "Treinador Principal"
2. Adicionar o MESMO profissional como "Apoio"
3. Adicionar o MESMO profissional como "Específicos"
4. Verificar que aparece apenas UM card/chip para o profissional
5. Verificar que o card mostra todos os papéis (`roles[]`)

**Resultado esperado:**
- ✅ Deduplicação visual (um card por profissional)
- ✅ Múltiplos papéis acumulados no mesmo card
- ✅ Array `roles[]` contém todos os papéis

---

### **GIF 3: Bloqueio profissional inativo**

**Passos para gravação:**
1. Ir para "Equipe" → "Profissionais"
2. Desativar um profissional (status = inativo)
3. Voltar para "Responsáveis" do aluno
4. Tentar vincular o profissional inativo
5. Verificar toast de erro bloqueando a ação

**Resultado esperado:**
- ✅ Toast de erro impede vinculação
- ✅ Profissional inativo não aparece na busca
- ✅ Validação funciona corretamente

---

### **PRINTS (3)**

#### **Print 1: API Response com roles[]**
1. Abrir F12 → Network
2. Vincular profissionais com múltiplos papéis
3. Capturar resposta de `GET /api/students/:id/responsibles`
4. Verificar estrutura: um registro por profissional com `roles: [...]`
5. Salvar como: `api-response-roles-array.png`

#### **Print 2: RLS Cross-tenant**
1. Tentar acessar dados de outro tenant
2. Capturar erro 403/404
3. Salvar como: `rls-cross-tenant-403.png`

#### **Print 3: EXPLAIN ANALYZE**
1. No banco, executar:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM student_responsibles WHERE student_id = '44571d07-7124-4630-8c91-a95a65a628f5';
   ```
2. Capturar resultado mostrando uso do índice
3. Salvar como: `explain-analyze-indices.png`

---

## 📋 **Checklist de Validação**

### **A-10.2.3 - MessageComposer**
- [ ] Tokens sempre `[EntreColchetes]`
- [ ] Inserção na posição do cursor (não no final)
- [ ] Prévia exibe mensagem resolvida
- [ ] Catálogo abaixo do textarea (não cobre mensagem)
- [ ] DateTime picker pt-BR com botão OK
- [ ] Enter confirma, Esc fecha o calendário
- [ ] Hoje → "Para Hoje" (exclusivo)
- [ ] Futuro → "Pendente"
- [ ] Deep-link foca card correto
- [ ] Console limpo (zero WARN/ERROR)
- [ ] WhatsApp abre com texto resolvido
- [ ] TZ America/Sao_Paulo, formato DD/MM/YYYY HH:mm

### **A-10.2.2.HF1 - Responsáveis**
- [ ] Principal único (exclusivo)
- [ ] Deduplicação visual por profissional
- [ ] Array `roles[]` acumula papéis
- [ ] Bloqueio profissional inativo
- [ ] API retorna `roles: [...]` por profissional
- [ ] RLS multi-tenant ativa
- [ ] Índices em uso (EXPLAIN ANALYZE)

---

## 🚀 **Entregáveis**

### **Arquivos de Evidência:**
- `gif-a-tarefa-hoje-17h.gif`
- `gif-b-tarefa-amanha-09h.gif`  
- `gif-c-variaveis-caret.gif`
- `console-limpo-composer-atualizacoes.png`
- `datetime-picker-pt-br-ok.png`
- `gif-1-principal-unico.gif`
- `gif-2-multiplos-papeis.gif`
- `gif-3-bloqueio-inativo.gif`
- `api-response-roles-array.png`
- `rls-cross-tenant-403.png`
- `explain-analyze-indices.png`

### **Relatórios Atualizados:**
- `web/testsprite_tests/gate-a-10-2-3-composer-processos.md`
- `web/testsprite_tests/gate-a-10-2-2-responsaveis.md`
- `web/Atividades.txt`

### **Commits:**
```bash
feat(messagecomposer): implement A-10.2.3 HF final with premium UX

- Variable insertion at cursor position with [Brackets] format
- Collapsible preview with resolved variables
- Variable catalog positioned below textarea
- pt-BR DateTime picker with OK/Enter/Esc support
- Deep-linking to relationship view with focusTaskId
- Clean console and robust date/time validation
- Immediate reflection in Kanban/Calendar/Timeline

Evidence: web/testsprite_tests/gate-a-10-2-3-composer-processos.md

feat(responsaveis): implement A-10.2.2.HF1 roles[] canonical model

- Migrated to single link per student×professional with roles[]
- Added UNIQUE constraint and partial index for principal
- Implemented visual deduplication with role badges
- Enhanced RLS security and validation

Evidence: web/testsprite_tests/gate-a-10-2-2-responsaveis.md
```
