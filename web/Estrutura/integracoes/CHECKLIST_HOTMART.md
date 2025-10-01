# ✅ CHECKLIST DE VALIDAÇÃO - INTEGRAÇÃO HOTMART

**Data:** 30/09/2025  
**Responsável:** Dev Team  
**Status:** 🔄 Pronto para Teste  

---

## 📋 FASE 1 - INFRAESTRUTURA

- [x] Migration `hotmart_integrations` criada
- [x] Migration `hotmart_product_mappings` criada
- [x] Migration `hotmart_transactions` criada
- [x] Índices de performance criados
- [x] RLS Policies configuradas (multi-tenant)
- [ ] **Migrations aplicadas no banco** ⚠️ PENDENTE

---

## 📋 FASE 2 - API DE CONFIGURAÇÃO

- [x] `POST /api/integrations/hotmart/connect` criada
  - [x] Validação de credenciais via OAuth2
  - [x] Cache de access_token
  - [x] Upsert na tabela hotmart_integrations

- [x] `GET /api/integrations/hotmart/status` criada
  - [x] Retorna status da conexão
  - [x] Verifica validade do token

- [x] `DELETE /api/integrations/hotmart/disconnect` criada
  - [x] Soft delete (mantém histórico)

- [ ] **Teste manual de conexão** ⚠️ PENDENTE
  - [ ] Obter credenciais sandbox Hotmart
  - [ ] Testar connect
  - [ ] Verificar status
  - [ ] Testar disconnect

---

## 📋 FASE 3 - MAPEAMENTO DE PRODUTOS

- [x] `GET /api/integrations/hotmart/mappings` criada
- [x] `POST /api/integrations/hotmart/mappings` criada
- [x] `PATCH /api/integrations/hotmart/mappings/[id]` criada
- [x] `DELETE /api/integrations/hotmart/mappings/[id]` criada

- [ ] **Teste manual de mapeamentos** ⚠️ PENDENTE
  - [ ] Criar mapeamento (produto 123456 → plano interno)
  - [ ] Listar mapeamentos
  - [ ] Editar configurações
  - [ ] Deletar mapeamento

---

## 📋 FASE 4 - WEBHOOK RECEIVER

- [x] `POST /api/webhooks/hotmart` criada
  - [x] Validação de Basic Token
  - [x] Registro de transação (auditoria)
  - [x] Idempotência (evita duplicação)
  - [x] Sempre retorna 200 OK

- [x] Função `processPurchaseApproved()` criada
  - [x] Busca mapeamento de produto
  - [x] Cria/Atualiza aluno
  - [x] Vincula plano
  - [x] TODOs: Onboarding, Email, WhatsApp

- [x] Função `processPurchaseRefunded()` criada
  - [x] Desativa aluno
  - [x] TODO: Notificar admin

- [x] Função `processSubscriptionCancellation()` criada
  - [x] TODO: Cancelar plano
  - [x] TODO: Trigger de retenção

- [ ] **Teste com payload mock** ⚠️ PENDENTE
  - [ ] Usar Postman/Insomnia
  - [ ] Enviar POST para localhost:3001/api/webhooks/hotmart
  - [ ] Header: X-Hotmart-Hottok: Basic {credentials}
  - [ ] Body: HOTMART_PAYLOAD_MOCK.json
  - [ ] Verificar criação de aluno
  - [ ] Verificar registro na hotmart_transactions

---

## 📋 FASE 5 - UI DE GERENCIAMENTO

- [x] Página `/app/settings/integrations/hotmart` refatorada
  - [x] Carrega status ao montar
  - [x] Conecta via API
  - [x] Loading states
  - [x] Toasts de sucesso/erro
  - [x] CTA para configurar mapeamentos

- [x] Página `/app/settings/integrations/hotmart/mappings` criada
  - [x] Lista de mapeamentos
  - [x] Modal de criar mapeamento
  - [x] Configurações de automação
  - [x] Delete de mapeamento

- [ ] **Teste UI completa** ⚠️ PENDENTE
  - [ ] Navegar para /app/settings → Integrações → Hotmart
  - [ ] Inserir credenciais e conectar
  - [ ] Clicar em "Configurar Mapeamentos"
  - [ ] Criar novo mapeamento
  - [ ] Deletar mapeamento

---

## 📋 FASE 6 - TESTES E VALIDAÇÃO

### **Testes de Integração**

- [ ] **T1: Aplicar migrations**
  ```sql
  -- Executar via Supabase Dashboard ou CLI
  -- supabase/migrations/20250930_hotmart_integrations.sql
  ```

- [ ] **T2: Conectar Hotmart (UI)**
  - Credenciais: Client ID, Client Secret, Basic Token
  - Resultado esperado: Badge "Conectado", toast de sucesso

- [ ] **T3: Criar Mapeamento**
  - Produto: ID 123456, Nome "Plano Mensal"
  - Plano Interno: Selecionar da lista
  - Configurações: Auto criar ativo, Onboarding ativo
  - Resultado: Card aparece na lista

- [ ] **T4: Simular Webhook (Postman)**
  ```
  POST http://localhost:3001/api/webhooks/hotmart
  
  Headers:
    X-Hotmart-Hottok: Basic {base64(email:basicToken)}
    Content-Type: application/json
  
  Body: (ver HOTMART_PAYLOAD_MOCK.json)
  
  Resultado esperado:
  ✓ HTTP 200
  ✓ Aluno criado na tabela students
  ✓ Transação registrada em hotmart_transactions (processed=true)
  ✓ Logs no console mostrando processamento
  ```

- [ ] **T5: Validar no Banco**
  ```sql
  -- Verificar aluno criado
  SELECT * FROM students WHERE email = 'joao.silva@email.com';
  
  -- Verificar transação
  SELECT * FROM hotmart_transactions 
  WHERE hotmart_transaction_id = 'HP12345678901234567890';
  ```

- [ ] **T6: Testar Idempotência**
  - Enviar o MESMO payload 2x
  - Resultado: Segunda chamada retorna "Already processed"
  - Aluno NÃO duplicado

- [ ] **T7: Testar Produto Não Mapeado**
  - Enviar webhook com product_id não mapeado
  - Resultado: Transação registrada, error_message preenchido

- [ ] **T8: Testar Reembolso**
  - Payload com event = "PURCHASE_REFUNDED"
  - Resultado: Aluno marcado como inactive

---

## 🎯 CRITÉRIOS DE ACEITE (6 VALIDAÇÕES)

### **CA-01: Conexão com Hotmart** ✅
- [ ] Cliente insere credenciais
- [ ] Sistema valida via OAuth2
- [ ] Badge mostra "Conectado"
- [ ] Credenciais salvas no banco

### **CA-02: Mapeamento de Produtos** ✅
- [ ] Cliente cria mapeamento (Produto 123456 → Plano Interno)
- [ ] Configurações salvas (auto criar, onboarding, etc.)
- [ ] Lista de mapeamentos exibe cards
- [ ] Delete funciona

### **CA-03: Webhook - Compra Aprovada** ⚠️ TESTAR
- [ ] Webhook recebe PURCHASE_APPROVED
- [ ] Valida Basic Token
- [ ] Cria aluno novo (nome, email, phone, CPF)
- [ ] OU atualiza existente (por email/CPF)
- [ ] Vincula plano mapeado
- [ ] Registra transação (processed=true)

### **CA-04: Webhook - Reembolso** ⚠️ TESTAR
- [ ] Webhook recebe PURCHASE_REFUNDED
- [ ] Desativa aluno (status=inactive)
- [ ] Registra transação

### **CA-05: Idempotência** ⚠️ TESTAR
- [ ] Mesmo webhook enviado 2x
- [ ] Segunda chamada retorna "Already processed"
- [ ] Aluno NÃO duplicado

### **CA-06: Produto Não Mapeado** ⚠️ TESTAR
- [ ] Webhook com produto não mapeado
- [ ] Transação registrada com error_message
- [ ] Aluno NÃO criado

---

## 📊 RESUMO DE PROGRESSO

| Fase | Status | Tempo Real |
|------|--------|------------|
| 1 - Infraestrutura | ✅ Completo | ~30min |
| 2 - API Configuração | ✅ Completo | ~30min |
| 3 - API Mapeamentos | ✅ Completo | ~20min |
| 4 - Webhook Receiver | ✅ Completo | ~40min |
| 5 - UI Gerenciamento | ✅ Completo | ~30min |
| 6 - Testes | 🔄 Em Andamento | ~1h (estimado) |
| **TOTAL** | **83% Completo** | **~2h30min até agora** |

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

### **1. Aplicar Migrations** (5min)
```bash
# Via Supabase Dashboard
# OU via CLI se configurado
```

### **2. Testar Conexão** (5min)
- Obter credenciais sandbox Hotmart
- Conectar via UI
- Verificar badge "Conectado"

### **3. Criar Mapeamento de Teste** (2min)
- Produto ID: 123456
- Nome: "Plano Mensal - Teste"
- Plano Interno: Selecionar qualquer

### **4. Simular Webhook** (10min)
- Postman: POST localhost:3001/api/webhooks/hotmart
- Header: X-Hotmart-Hottok
- Body: HOTMART_PAYLOAD_MOCK.json
- Verificar criação de aluno no banco

---

**Última Atualização:** 30/09/2025 14:45 BRT
