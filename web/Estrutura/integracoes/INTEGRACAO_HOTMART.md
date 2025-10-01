# 🔥 INTEGRAÇÃO HOTMART - ANÁLISE TÉCNICA COMPLETA

**Data:** 30/09/2025  
**Responsável:** Dev Team  
**Status:** 📋 Em Planejamento  
**Documentação Oficial:** https://developers.hotmart.com/docs/pt-BR/

---

## 🎯 OBJETIVOS DA INTEGRAÇÃO

### **Escopo Mínimo Viável (MVP)**

1. ✅ **Criação Automática de Alunos**
   - Compra aprovada na Hotmart → Aluno criado automaticamente no sistema
   - Sincronizar dados: nome, email, telefone, CPF

2. ✅ **Vinculação de Planos**
   - Produto Hotmart → Plano interno (mapeamento configurável)
   - Gestão financeira automática (valor, ciclo, vencimento)

### **Funcionalidades Adicionais Recomendadas**

3. 🔄 **Gestão de Assinaturas Recorrentes**
   - Sincronizar status: ativa, cancelada, suspensa, atrasada
   - Renovações automáticas
   - Alertas de cancelamento

4. 💰 **Controle Financeiro**
   - Registro de transações (vendas, reembolsos, chargebacks)
   - Comissões de afiliados
   - Relatórios de receita

5. 🔔 **Eventos e Notificações**
   - Compra aprovada → Email boas-vindas + WhatsApp
   - Assinatura cancelada → Trigger de retenção
   - Reembolso → Desativar acesso do aluno

---

## 🔌 ARQUITETURA DA INTEGRAÇÃO HOTMART

### **Fluxo Completo:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOTMART                                   │
├─────────────────────────────────────────────────────────────────┤
│  1. Cliente compra produto na Hotmart                           │
│  2. Hotmart processa pagamento                                  │
│  3. Pagamento aprovado → Hotmart dispara Webhook                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               NOSSO SISTEMA (Webhook Receiver)                   │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/webhooks/hotmart                                     │
│                                                                  │
│  4. Validar assinatura do webhook (Basic Token)                 │
│  5. Processar evento:                                           │
│     - PURCHASE_COMPLETE                                         │
│     - PURCHASE_APPROVED ← PRINCIPAL                             │
│     - PURCHASE_REFUNDED                                         │
│     - SUBSCRIPTION_CANCELLATION                                 │
│     - etc.                                                      │
│                                                                  │
│  6. Executar ações baseadas no evento:                          │
│     ├─ Criar/Atualizar aluno                                    │
│     ├─ Vincular plano                                           │
│     ├─ Registrar transação financeira                           │
│     ├─ Disparar onboarding (se novo aluno)                      │
│     └─ Enviar notificações (email/WhatsApp)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 EVENTOS HOTMART (WEBHOOKS)

Baseado na documentação oficial: https://developers.hotmart.com/docs/pt-BR/1.0.0/webhook/using-webhook/

### **Eventos de Compra (Prioritários)**

| Evento | Quando Dispara | Ação no Sistema |
|--------|----------------|-----------------|
| `PURCHASE_COMPLETE` | Compra finalizada (qualquer status) | Log de tentativa de compra |
| `PURCHASE_APPROVED` | **Pagamento aprovado** | ✅ **Criar aluno + Vincular plano** |
| `PURCHASE_REFUNDED` | Reembolso processado | ❌ Desativar aluno, registrar reembolso |
| `PURCHASE_CHARGEBACK` | Chargeback recebido | ❌ Desativar aluno, marcar como chargeback |
| `PURCHASE_PROTEST` | Protesto de pagamento | ⚠️ Alertar equipe financeira |

### **Eventos de Assinatura (Recorrência)**

| Evento | Quando Dispara | Ação no Sistema |
|--------|----------------|-----------------|
| `SUBSCRIPTION_CANCELLATION` | Assinatura cancelada pelo cliente | ❌ Desativar plano, trigger de retenção |
| `SUBSCRIPTION_REACTIVATION` | Assinatura reativada | ✅ Reativar plano |
| `SUBSCRIPTION_DELAYED` | Pagamento atrasado | ⚠️ Enviar lembrete de pagamento |

### **Eventos de Afiliado**

| Evento | Quando Dispara | Ação no Sistema |
|--------|----------------|-----------------|
| `AFFILIATE_COMMISSION` | Comissão de afiliado gerada | 💰 Registrar comissão (se gerenciar afiliados) |

---

## 🔐 AUTENTICAÇÃO HOTMART

### **Método 1: Webhook com Basic Token (Recomendado para MVP)**

```http
POST /api/webhooks/hotmart
Headers:
  X-Hotmart-Hottok: Basic {base64(email:basicToken)}
Body:
  {
    "event": "PURCHASE_APPROVED",
    "data": { ... }
  }
```

**Validação:**
```typescript
// Verificar token no header
const hottok = request.headers.get('X-Hotmart-Hottok')
const [method, credentials] = hottok.split(' ')

if (method !== 'Basic') {
  return NextResponse.json({ error: 'Invalid auth' }, { status: 401 })
}

const decoded = Buffer.from(credentials, 'base64').toString()
const [email, basicToken] = decoded.split(':')

// Buscar integração da org no banco
const integration = await getHotmartIntegration(orgId)

if (basicToken !== integration.basic_token) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### **Método 2: OAuth2 (API REST - Para funcionalidades avançadas)**

```
1. Client Credentials Flow
2. Endpoint: https://api-sec-vlc.hotmart.com/security/oauth/token
3. Headers: 
   - Authorization: Basic {base64(clientId:clientSecret)}
   - Content-Type: application/json
4. Body:
   {
     "grant_type": "client_credentials",
     "client_id": "YOUR_CLIENT_ID",
     "client_secret": "YOUR_CLIENT_SECRET"
   }
5. Response:
   {
     "access_token": "...",
     "token_type": "bearer",
     "expires_in": 3600
   }
```

**Uso do Access Token:**
```http
GET https://developers.hotmart.com/payments/api/v1/sales/history
Headers:
  Authorization: Bearer {access_token}
```

---

## 📦 PAYLOAD DO WEBHOOK - PURCHASE_APPROVED

### **Estrutura do Evento:**

```json
{
  "id": "d5b2c8f4-3a1e-4b7c-9f0d-1e8a6c3b5d7f",
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "data": {
    "product": {
      "id": 123456,
      "name": "Plano Mensal - Academia Alpha",
      "ucode": "abc-def-ghi"
    },
    "buyer": {
      "name": "João Silva",
      "email": "joao.silva@email.com",
      "checkout_phone": "+5511987654321",
      "document": "12345678900"
    },
    "purchase": {
      "order_ref": "HPM123456789",
      "status": "approved",
      "approved_date": 1696089600000,
      "transaction": "HP12345678901234567890",
      "price": {
        "currency_code": "BRL",
        "value": 199.90
      },
      "payment": {
        "type": "CREDIT_CARD",
        "installments_number": 1
      },
      "subscription": {
        "status": "ACTIVE",
        "plan": {
          "name": "Mensal"
        },
        "subscriber": {
          "code": "SUB-ABC123"
        }
      }
    },
    "producer": {
      "name": "Academia Alpha"
    },
    "commissions": [
      {
        "name": "Afiliado X",
        "value": 39.98
      }
    ]
  },
  "hottok": "Basic YWNhZGVtaWFAZXhhbXBsZS5jb206YmFzaWN0b2tlbjEyMw=="
}
```

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS

### **Tabela: `hotmart_integrations`**

```sql
CREATE TABLE hotmart_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  
  -- Credenciais
  client_id VARCHAR(255) NOT NULL,
  client_secret VARCHAR(255) NOT NULL, -- Criptografar
  basic_token VARCHAR(255) NOT NULL, -- Para validar webhooks
  
  -- OAuth Token (cache)
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'disconnected', -- disconnected, connected, error
  last_sync TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id) -- Uma integração por organização
);
```

### **Tabela: `hotmart_product_mappings`**

```sql
CREATE TABLE hotmart_product_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  
  -- Produto Hotmart
  hotmart_product_id BIGINT NOT NULL,
  hotmart_product_name VARCHAR(255),
  hotmart_product_ucode VARCHAR(100),
  
  -- Plano Interno
  internal_plan_id UUID REFERENCES plans(id) NOT NULL,
  
  -- Configurações
  auto_create_student BOOLEAN DEFAULT TRUE,
  auto_activate BOOLEAN DEFAULT TRUE,
  trigger_onboarding BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, hotmart_product_id)
);
```

### **Tabela: `hotmart_transactions`**

```sql
CREATE TABLE hotmart_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  student_id UUID REFERENCES students(id),
  
  -- Dados Hotmart
  hotmart_transaction_id VARCHAR(100) UNIQUE NOT NULL,
  hotmart_order_ref VARCHAR(100),
  hotmart_subscriber_code VARCHAR(100),
  
  -- Evento
  event_type VARCHAR(50) NOT NULL, -- PURCHASE_APPROVED, REFUNDED, etc.
  event_date TIMESTAMPTZ NOT NULL,
  
  -- Produto
  product_id BIGINT,
  product_name VARCHAR(255),
  
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
  
  -- Payload completo (para auditoria)
  raw_payload JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_hotmart_transactions_org_student (org_id, student_id),
  INDEX idx_hotmart_transactions_event (event_type, event_date),
  INDEX idx_hotmart_transactions_processed (processed, created_at)
);
```

---

## 🔄 FLUXO DE PROCESSAMENTO - PURCHASE_APPROVED

### **Endpoint:** `POST /api/webhooks/hotmart`

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. VALIDAR AUTENTICAÇÃO
    const hottok = request.headers.get('X-Hotmart-Hottok')
    if (!hottok || !hottok.startsWith('Basic ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const credentials = Buffer.from(hottok.split(' ')[1], 'base64').toString()
    const [email, basicToken] = credentials.split(':')
    
    // 2. PARSEAR PAYLOAD
    const payload = await request.json()
    const { event, data } = payload
    
    // 3. IDENTIFICAR ORGANIZAÇÃO
    // Opção A: Por email do producer
    // Opção B: Por produto (mapeamento prévio)
    // Opção C: Por basic_token (cada org tem token único)
    
    const integration = await supabase
      .from('hotmart_integrations')
      .select('*')
      .eq('basic_token', basicToken)
      .single()
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }
    
    const orgId = integration.org_id
    
    // 4. REGISTRAR TRANSAÇÃO (AUDITORIA)
    await supabase
      .from('hotmart_transactions')
      .insert({
        org_id: orgId,
        hotmart_transaction_id: data.purchase.transaction,
        hotmart_order_ref: data.purchase.order_ref,
        event_type: event,
        event_date: new Date(data.purchase.approved_date).toISOString(),
        product_id: data.product.id,
        product_name: data.product.name,
        currency: data.purchase.price.currency_code,
        gross_value: data.purchase.price.value,
        payment_type: data.purchase.payment.type,
        installments: data.purchase.payment.installments_number,
        subscription_status: data.purchase.subscription?.status,
        subscription_plan: data.purchase.subscription?.plan?.name,
        raw_payload: payload,
        processed: false
      })
    
    // 5. PROCESSAR EVENTO
    if (event === 'PURCHASE_APPROVED') {
      await processPurchaseApproved(orgId, data)
    } else if (event === 'PURCHASE_REFUNDED') {
      await processPurchaseRefunded(orgId, data)
    } else if (event === 'SUBSCRIPTION_CANCELLATION') {
      await processSubscriptionCancellation(orgId, data)
    }
    
    // 6. RESPONDER HOTMART (200 OK obrigatório!)
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed' 
    })
    
  } catch (error) {
    console.error('[HOTMART WEBHOOK] Error:', error)
    // IMPORTANTE: Retornar 200 mesmo com erro interno
    // (para Hotmart não ficar reenviando)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 200 })
  }
}
```

---

## 🎓 LÓGICA: CRIAR ALUNO AUTOMATICAMENTE

### **Função:** `processPurchaseApproved(orgId, data)`

```typescript
async function processPurchaseApproved(orgId: string, data: any) {
  const supabase = await createClientAdmin()
  
  // 1. EXTRAIR DADOS DO COMPRADOR
  const buyerData = {
    name: data.buyer.name,
    email: data.buyer.email,
    phone: data.buyer.checkout_phone,
    cpf: data.buyer.document
  }
  
  // 2. VERIFICAR SE ALUNO JÁ EXISTE (por email OU CPF)
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id, status')
    .eq('org_id', orgId)
    .or(`email.eq.${buyerData.email},cpf.eq.${buyerData.cpf}`)
    .single()
  
  let studentId: string
  
  if (existingStudent) {
    // ALUNO JÁ EXISTE
    studentId = existingStudent.id
    
    // Atualizar dados (caso tenham mudado)
    await supabase
      .from('students')
      .update({
        name: buyerData.name,
        phone: buyerData.phone,
        status: 'active', // Reativar se estava inativo
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
    
  } else {
    // CRIAR NOVO ALUNO
    const { data: newStudent, error } = await supabase
      .from('students')
      .insert({
        org_id: orgId,
        name: buyerData.name,
        email: buyerData.email,
        phone: buyerData.phone,
        cpf: buyerData.cpf,
        status: 'active',
        source: 'hotmart', // Importante: rastrear origem
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()
    
    if (error) throw error
    studentId = newStudent.id
  }
  
  // 3. BUSCAR MAPEAMENTO DE PLANO
  const { data: mapping } = await supabase
    .from('hotmart_product_mappings')
    .select('internal_plan_id, auto_create_student, trigger_onboarding')
    .eq('org_id', orgId)
    .eq('hotmart_product_id', data.product.id)
    .single()
  
  if (!mapping) {
    // PRODUTO NÃO MAPEADO - Criar alerta
    console.warn(`[HOTMART] Produto ${data.product.id} não mapeado para org ${orgId}`)
    // TODO: Notificar admin para configurar mapeamento
    return
  }
  
  // 4. VINCULAR PLANO AO ALUNO
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', mapping.internal_plan_id)
    .single()
  
  // Criar registro de matrícula/assinatura
  await supabase
    .from('student_plans') // ou student_enrollments
    .insert({
      student_id: studentId,
      plan_id: mapping.internal_plan_id,
      hotmart_order_ref: data.purchase.order_ref,
      hotmart_subscriber_code: data.purchase.subscription?.subscriber?.code,
      status: 'active',
      start_date: new Date(data.purchase.approved_date).toISOString(),
      value: data.purchase.price.value,
      cycle: plan.ciclo || 'monthly',
      payment_method: data.purchase.payment.type,
      created_at: new Date().toISOString()
    })
  
  // 5. DISPARAR ONBOARDING (se configurado)
  if (mapping.trigger_onboarding) {
    // Criar cards no Kanban de Onboarding
    await createOnboardingCards(studentId, orgId)
  }
  
  // 6. ENVIAR NOTIFICAÇÕES DE BOAS-VINDAS
  // - Email de boas-vindas
  // - WhatsApp (se integrado)
  await sendWelcomeNotifications(studentId, orgId)
  
  // 7. MARCAR TRANSAÇÃO COMO PROCESSADA
  await supabase
    .from('hotmart_transactions')
    .update({ 
      processed: true, 
      processed_at: new Date().toISOString(),
      student_id: studentId
    })
    .eq('hotmart_transaction_id', data.purchase.transaction)
}
```

---

## 🗺️ MAPEAMENTO DE PRODUTOS (UI)

### **Tela de Configuração:**

```
┌─────────────────────────────────────────────────────────────┐
│  MAPEAMENTO DE PRODUTOS HOTMART                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Produto Hotmart              →    Plano Interno             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Plano Mensal - Academia      →    [Mensal Personal]         │
│  ID: 123456                         Valor: R$ 199,90         │
│                                                               │
│  Plano Trimestral             →    [Trimestral]              │
│  ID: 123457                         Valor: R$ 499,00         │
│                                                               │
│  Plano Anual                  →    [Anual VIP]               │
│  ID: 123458                         Valor: R$ 1.599,00       │
│                                                               │
│  [+ Adicionar Novo Mapeamento]                               │
└─────────────────────────────────────────────────────────────┘

Opções por mapeamento:
☑ Criar aluno automaticamente
☑ Ativar plano imediatamente
☑ Disparar onboarding
☐ Enviar email de boas-vindas
☑ Enviar WhatsApp de boas-vindas
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### **FASE 1 - Infraestrutura (2-3h)**

- [ ] Criar migration: `hotmart_integrations`
- [ ] Criar migration: `hotmart_product_mappings`
- [ ] Criar migration: `hotmart_transactions`
- [ ] Adicionar RLS policies para multi-tenant
- [ ] Criar índices de performance

### **FASE 2 - API de Configuração (2-3h)**

- [ ] `POST /api/integrations/hotmart/connect`
  - Salvar credenciais (criptografadas)
  - Testar OAuth2
  - Retornar status

- [ ] `GET /api/integrations/hotmart/status`
  - Buscar integração
  - Validar token
  - Retornar conexão ativa/inativa

- [ ] `DELETE /api/integrations/hotmart/disconnect`
  - Remover credenciais
  - Limpar cache de token

- [ ] `GET /api/integrations/hotmart/products`
  - Listar produtos da Hotmart via API
  - Para facilitar mapeamento

### **FASE 3 - Mapeamento de Produtos (3-4h)**

- [ ] `POST /api/integrations/hotmart/mappings`
  - Criar mapeamento produto → plano
  
- [ ] `GET /api/integrations/hotmart/mappings`
  - Listar mapeamentos configurados
  
- [ ] `PATCH /api/integrations/hotmart/mappings/:id`
  - Editar mapeamento

- [ ] `DELETE /api/integrations/hotmart/mappings/:id`
  - Remover mapeamento

- [ ] UI: Tela de mapeamento (drag & drop ou select)

### **FASE 4 - Webhook Receiver (4-5h)**

- [ ] `POST /api/webhooks/hotmart`
  - Validar Basic Token
  - Parsear payload
  - Identificar organização
  - Registrar transação
  - Processar eventos

- [ ] Função: `processPurchaseApproved()`
  - Criar/atualizar aluno
  - Vincular plano
  - Disparar onboarding
  - Enviar notificações

- [ ] Função: `processPurchaseRefunded()`
  - Desativar plano
  - Registrar reembolso
  - Notificar admin

- [ ] Função: `processSubscriptionCancellation()`
  - Cancelar plano
  - Trigger de retenção
  - Notificar aluno

### **FASE 5 - UI de Gerenciamento (2-3h)**

- [ ] Página: `/app/settings/integrations/hotmart/mappings`
  - Lista de mapeamentos
  - CRUD de mapeamentos
  
- [ ] Página: `/app/settings/integrations/hotmart/logs`
  - Log de transações recebidas
  - Status de processamento
  - Errors/retries

- [ ] Dashboard: Métricas de integração
  - Total de vendas sincronizadas
  - Alunos criados automaticamente
  - Últimas transações

### **FASE 6 - Testes e Validação (2-3h)**

- [ ] Testes unitários: Validação de webhook
- [ ] Testes de integração: Mock de payload Hotmart
- [ ] Teste manual: Ambiente Sandbox Hotmart
- [ ] Documentação de troubleshooting
- [ ] Evidências e checklist de validação

---

## 🔒 SEGURANÇA E BOAS PRÁTICAS

### **1. Validação de Webhook**
```typescript
// SEMPRE validar o Basic Token
// SEMPRE registrar a transação ANTES de processar
// Retornar 200 OK mesmo com erro (para Hotmart não reenviar)
```

### **2. Idempotência**
```typescript
// Usar hotmart_transaction_id como chave única
// Se já processou, retornar 200 sem reprocessar
const exists = await checkTransactionExists(data.purchase.transaction)
if (exists) {
  return NextResponse.json({ success: true, message: 'Already processed' })
}
```

### **3. Criptografia**
```typescript
// Criptografar credenciais no banco
import { encrypt, decrypt } from '@/lib/crypto'

await supabase.from('hotmart_integrations').insert({
  client_secret: encrypt(clientSecret),
  basic_token: encrypt(basicToken)
})
```

### **4. Rate Limiting**
```typescript
// Hotmart pode reenviar webhooks em caso de falha
// Implementar rate limit para evitar spam
```

---

## 🧪 AMBIENTE DE TESTES HOTMART

### **Sandbox**
- URL: https://sandbox.hotmart.com
- Criar conta de testes
- Simular vendas
- Testar webhooks

### **Ferramentas de Debug**
- Postman/Insomnia: Simular webhooks localmente
- Ngrok: Expor localhost para receber webhooks reais
- Webhook.site: Inspecionar payloads

---

## 📊 ESTIMATIVA DE ESFORÇO

| Fase | Descrição | Tempo Estimado |
|------|-----------|----------------|
| 1 | Infraestrutura (migrations) | 2-3h |
| 2 | API de Configuração | 2-3h |
| 3 | Mapeamento de Produtos | 3-4h |
| 4 | Webhook Receiver | 4-5h |
| 5 | UI de Gerenciamento | 2-3h |
| 6 | Testes e Validação | 2-3h |
| **TOTAL** | **Integração Completa** | **15-21h (~3 dias)** |

---

## 🎯 CRITÉRIOS DE ACEITE

### **CA-01: Conexão com Hotmart**
- [ ] Cliente consegue inserir credenciais (Client ID + Secret + Basic Token)
- [ ] Sistema valida credenciais via OAuth2
- [ ] Badge mostra "Conectado" quando ativo

### **CA-02: Mapeamento de Produtos**
- [ ] Cliente consegue listar produtos da Hotmart
- [ ] Cliente mapeia produto Hotmart → Plano interno
- [ ] Configurações: criar aluno auto, disparar onboarding, etc.

### **CA-03: Webhook - Compra Aprovada**
- [ ] Webhook recebe evento PURCHASE_APPROVED
- [ ] Valida Basic Token
- [ ] Cria aluno novo OU atualiza existente (por email/CPF)
- [ ] Vincula plano mapeado
- [ ] Dispara onboarding (se configurado)
- [ ] Envia notificações de boas-vindas
- [ ] Registra transação no banco

### **CA-04: Webhook - Reembolso**
- [ ] Webhook recebe evento PURCHASE_REFUNDED
- [ ] Desativa plano do aluno
- [ ] Registra reembolso
- [ ] Notifica admin

### **CA-05: Webhook - Cancelamento de Assinatura**
- [ ] Webhook recebe evento SUBSCRIPTION_CANCELLATION
- [ ] Cancela plano do aluno
- [ ] Dispara flow de retenção
- [ ] Notifica aluno

### **CA-06: Logs e Auditoria**
- [ ] Todas as transações são registradas
- [ ] Admin consegue ver log de eventos
- [ ] Errors são exibidos para troubleshooting
- [ ] Retry manual disponível para eventos falhados

---

## 🚀 PLANO DE EXECUÇÃO (AMANHÃ - 01/10/2025)

### **Manhã (4h)**
1. Criar migrations (Fase 1)
2. Implementar APIs de configuração (Fase 2)
3. Testar conexão OAuth2 com Hotmart Sandbox

### **Tarde (4h)**
4. Implementar webhook receiver (Fase 4 - parcial)
5. Implementar lógica de criação de aluno
6. Implementar mapeamento de produtos (Fase 3 - parcial)

### **Noite (2h)**
7. Testes manuais com payloads mock
8. Documentação e evidências
9. Registro em Atividades.txt

---

## 📚 REFERÊNCIAS

- **Documentação Oficial:** https://developers.hotmart.com/docs/pt-BR/
- **Webhooks:** https://developers.hotmart.com/docs/pt-BR/1.0.0/webhook/using-webhook/
- **OAuth2:** https://developers.hotmart.com/docs/pt-BR/start/about/
- **Sandbox:** https://sandbox.hotmart.com

---

**Próximo Passo:** Você aprova este plano para começarmos amanhã (01/10)?

═══════════════════════════════════════════════════════════════════════════════
                        FIM DA ANÁLISE TÉCNICA HOTMART
═══════════════════════════════════════════════════════════════════════════════
