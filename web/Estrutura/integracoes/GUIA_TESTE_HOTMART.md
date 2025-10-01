# 🧪 GUIA COMPLETO DE TESTES - INTEGRAÇÃO HOTMART

**Data:** 30/09/2025  
**Responsável:** Dev Team  

---

## 🎯 OBJETIVO

Validar que a integração Hotmart está funcionando corretamente:
1. ✅ Recebe webhooks
2. ✅ Cria alunos automaticamente
3. ✅ Vincula planos
4. ✅ Registra transações

---

## 📋 PRÉ-REQUISITOS

### **1. Criar Plano de Teste** ⏱️ 2min

```
1. Acessar: /app/services/financial
2. Clicar tab "Planos"
3. Criar novo plano:
   - Código: MENSAL_TESTE
   - Nome: Plano Mensal - Teste Hotmart
   - Valor: R$ 199,90
   - Ciclo: mensal
   - Ativo: ✓
4. Copiar o UUID do plano criado
```

### **2. Criar Mapeamento de Teste** ⏱️ 1min

```
1. Acessar: /app/settings → Integrações → Hotmart
2. (Conectar Hotmart se ainda não conectou - pode usar credenciais fictícias para teste local)
3. Clicar: "Configurar Mapeamentos"
4. Criar mapeamento:
   - Produto Hotmart ID: 123456
   - Nome: Plano Mensal - Personal Trainer
   - Plano Interno: [Selecionar "Plano Mensal - Teste Hotmart"]
   - Auto criar: ✓
   - Auto ativar: ✓
   - Onboarding: ✓
5. Salvar
```

---

## 🧪 MÉTODO 1 - TESTE VIA INTERFACE (Mais Fácil)

### **Passo a Passo:**

```
1. Acessar: /app/settings/integrations/hotmart/test
   
2. Selecionar evento: "Compra Aprovada"
   
3. Editar o JSON (opcional):
   - Mudar buyer.email se quiser
   - Mudar buyer.name
   - Confirmar que product.id = 123456 (mesmo do mapeamento)
   
4. Clicar: "Simular Webhook Hotmart"
   
5. Aguardar resultado (2-3 segundos)

6. Validar:
   ✓ Toast de sucesso
   ✓ Resultado HTTP 200 OK
   ✓ Message: "Webhook processed"
```

### **Verificar Resultados:**

```sql
-- No Supabase SQL Editor:

-- 1. Verificar aluno criado
SELECT id, name, email, status, source 
FROM students 
WHERE email = 'joao.teste@email.com';

-- 2. Verificar transação registrada
SELECT 
  id, 
  event_type, 
  buyer_name, 
  buyer_email, 
  processed, 
  error_message,
  created_at
FROM hotmart_transactions 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar serviço vinculado
SELECT 
  s.name AS student_name,
  sv.name AS service_name,
  sv.status,
  sv.price_cents / 100.0 AS price,
  sv.created_at
FROM student_services sv
JOIN students s ON sv.student_id = s.id
WHERE s.email = 'joao.teste@email.com';
```

---

## 🧪 MÉTODO 2 - TESTE VIA POSTMAN/INSOMNIA

### **Configuração:**

```
Método: POST
URL: http://localhost:3001/api/webhooks/hotmart

Headers:
  Content-Type: application/json
  X-Hotmart-Hottok: Basic dGVzdEBlbWFpbC5jb206dGVzdC1iYXNpYy10b2tlbi0xMjM=

Body (raw JSON):
```

```json
{
  "id": "d5b2c8f4-3a1e-4b7c-9f0d-1e8a6c3b5d7f",
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "creation_date": 1696089600000,
  "data": {
    "product": {
      "id": 123456,
      "name": "Plano Mensal - Personal Trainer",
      "ucode": "abc-def-ghi-123"
    },
    "buyer": {
      "name": "Maria Santos Teste",
      "email": "maria.teste@email.com",
      "checkout_phone": "+5521912345678",
      "document": "98765432100"
    },
    "purchase": {
      "order_ref": "HPM999888777",
      "status": "approved",
      "approved_date": 1696089600000,
      "transaction": "HP999888777666555444",
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
          "code": "SUB-TEST-123"
        }
      }
    },
    "producer": {
      "name": "Academia Alpha"
    }
  }
}
```

**Enviar** e verificar Response 200 OK.

---

## 🧪 MÉTODO 3 - TESTE COM HOTMART SANDBOX (Avançado)

### **Configurar Sandbox Hotmart:**

```
1. Criar conta em: https://sandbox.hotmart.com

2. Criar produto de teste:
   - Nome: Plano Teste
   - Preço: R$ 10,00 (mínimo para teste)
   - Tipo: Assinatura Recorrente (mensal)
   
3. Obter credenciais OAuth2:
   - Client ID
   - Client Secret
   - Basic Token
   
4. Conectar no sistema (/app/settings/integrations/hotmart)

5. Criar mapeamento (Produto Sandbox → Plano interno)

6. Configurar Webhook/Postback no Sandbox:
   - URL: https://seu-dominio.com/api/webhooks/hotmart
   - (Use ngrok se estiver em localhost)
   
7. Fazer uma compra de teste no Sandbox

8. Hotmart enviará webhook REAL para seu sistema!
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **Teste 1: Compra Aprovada - Aluno Novo**

- [ ] Webhook recebido (HTTP 200)
- [ ] Aluno criado na tabela `students`
  - [ ] Nome correto
  - [ ] Email correto
  - [ ] CPF correto
  - [ ] Status = 'active'
  - [ ] Source = 'hotmart'
- [ ] Serviço vinculado na tabela `student_services`
  - [ ] Nome do plano correto
  - [ ] Valor correto (price_cents)
  - [ ] Status = 'active'
  - [ ] purchase_status = 'paid'
- [ ] Transação registrada em `hotmart_transactions`
  - [ ] processed = true
  - [ ] error_message = NULL
  - [ ] student_id preenchido

### **Teste 2: Compra Aprovada - Aluno Existente**

- [ ] Webhook enviado com email JÁ cadastrado
- [ ] Aluno NÃO duplicado
- [ ] Dados do aluno ATUALIZADOS (nome, telefone)
- [ ] Novo serviço adicionado ao aluno existente

### **Teste 3: Produto Não Mapeado**

- [ ] Webhook com product_id = 999999 (não mapeado)
- [ ] HTTP 200 OK (não falha)
- [ ] Transação registrada com error_message
- [ ] Aluno NÃO criado
- [ ] processed = false

### **Teste 4: Idempotência**

- [ ] Enviar MESMO webhook 2 vezes
- [ ] Primeira: Aluno criado
- [ ] Segunda: "Already processed"
- [ ] Aluno NÃO duplicado

### **Teste 5: Reembolso**

- [ ] Webhook PURCHASE_REFUNDED
- [ ] Aluno marcado como inactive
- [ ] Transação registrada

---

## 🐛 TROUBLESHOOTING

### **Erro: "Integration not configured"**
```
Solução: 
1. Verificar se existe registro em hotmart_integrations
2. SELECT * FROM hotmart_integrations;
3. Se vazio, conectar via /app/settings/integrations/hotmart
```

### **Erro: "Produto não está mapeado"**
```
Solução:
1. Verificar mapeamentos existentes
2. SELECT * FROM hotmart_product_mappings;
3. Criar mapeamento para o produto no webhook
```

### **Aluno não foi criado**
```
Debug:
1. Verificar logs do console (F12)
2. Verificar hotmart_transactions.error_message
3. Verificar se auto_create_student = true no mapeamento
```

### **Webhook retorna 401 Unauthorized**
```
Solução:
1. Verificar header X-Hotmart-Hottok
2. Formato: Basic {base64(email:basicToken)}
3. Verificar se basic_token no header corresponde ao do banco
```

---

## 📊 QUERIES ÚTEIS PARA DEBUG

```sql
-- Listar todas as transações recebidas
SELECT 
  event_type,
  buyer_name,
  buyer_email,
  gross_value,
  processed,
  error_message,
  created_at
FROM hotmart_transactions
ORDER BY created_at DESC
LIMIT 10;

-- Verificar mapeamentos ativos
SELECT 
  hpm.hotmart_product_name,
  p.nome AS plano_nome,
  p.valor,
  hpm.auto_create_student,
  hpm.created_at
FROM hotmart_product_mappings hpm
JOIN plans p ON hpm.internal_plan_id = p.id
WHERE hpm.org_id = 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7';

-- Alunos criados via Hotmart
SELECT 
  name,
  email,
  phone,
  status,
  source,
  created_at
FROM students
WHERE source = 'hotmart'
ORDER BY created_at DESC;

-- Serviços vinculados aos alunos Hotmart
SELECT 
  s.name AS student_name,
  s.email,
  sv.name AS service_name,
  sv.price_cents / 100.0 AS price_brl,
  sv.status,
  sv.created_at
FROM student_services sv
JOIN students s ON sv.student_id = s.id
WHERE s.source = 'hotmart'
ORDER BY sv.created_at DESC;
```

---

## 🎯 RESULTADO ESPERADO

Após teste bem-sucedido:

```
✅ Aluno "João Silva Teste" criado
✅ Email: joao.teste@email.com
✅ Status: active
✅ Source: hotmart

✅ Serviço vinculado: "Plano Mensal - Teste Hotmart"
✅ Valor: R$ 199,90
✅ Status: active

✅ Transação registrada
✅ Event: PURCHASE_APPROVED
✅ Processed: true
✅ Error: null

✅ Logs no console mostrando processamento passo a passo
```

---

**Última Atualização:** 30/09/2025 15:30 BRT
