# Sistema de Relacionamento - Explicação Completa

## 🎯 **Conceito Geral**

O sistema de relacionamento é um **motor de mensagens automáticas** que envia comunicações personalizadas para alunos baseado em **eventos específicos** (âncoras) e **templates configuráveis**.

## 📋 **Componentes Principais**

### **1. Templates (Modelos de Mensagem)**
- **O que são:** Modelos pré-definidos de mensagens que podem ser personalizadas
- **Campos principais:**
  - `code`: Identificador único (ex: MSG1, MSG2)
  - `title`: Nome descritivo (ex: "Após a Venda")
  - `anchor`: Evento que dispara a mensagem (ex: "sale_close")
  - `message_v1`: Versão principal da mensagem
  - `message_v2`: Versão alternativa da mensagem
  - `channel_default`: Canal padrão (whatsapp, email, ligação)
  - `variables`: Lista de variáveis disponíveis

### **2. Âncoras (Eventos Disparadores)**
- **O que são:** Eventos específicos que disparam o envio de mensagens
- **Tipos de âncoras:**
  - `sale_close`: Fechamento da venda
  - `first_workout`: Primeiro treino
  - `weekly_followup`: Acompanhamento semanal
  - `monthly_review`: Revisão mensal
  - `birthday`: Aniversário do aluno
  - `renewal_window`: Janela de renovação
  - `occurrence_followup`: Seguimento de ocorrência

### **3. Motor de Tarefas**
- **O que é:** Sistema que processa as âncoras e gera tarefas de envio
- **Funcionamento:**
  1. **Job diário (03:00):** Processa todas as âncoras ativas
  2. **Gatilho imediato:** Dispara quando ocorrência com lembrete é criada
  3. **Recalcular manual:** Permite reprocessar tarefas sob demanda

## ⚙️ **Fluxo de Funcionamento**

### **Passo 1: Configuração**
1. Admin cria templates com âncoras específicas
2. Define variáveis disponíveis para personalização
3. Configura canais de envio (WhatsApp, E-mail, etc.)

### **Passo 2: Disparo**
1. **Evento ocorre** (ex: aluno completa primeiro treino)
2. **Motor identifica** templates com âncora correspondente
3. **Aplica filtros** de audiência (status, tags, etc.)
4. **Gera tarefa** de envio com dados personalizados

### **Passo 3: Processamento**
1. **Sistema renderiza** mensagem com variáveis reais
2. **Cria tarefa** no Kanban para operador
3. **Operador visualiza** e pode enviar manualmente
4. **Sistema registra** envio e atualiza status

## 🔧 **Gatilhos e Motor**

### **Job Diário (03:00)**
```sql
-- Exemplo de query para âncora 'birthday'
SELECT s.* FROM students s 
WHERE EXTRACT(MONTH FROM s.data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(DAY FROM s.data_nascimento) = EXTRACT(DAY FROM CURRENT_DATE)
AND s.status = 'ativo'
```

### **Gatilho de Ocorrência**
```typescript
// Quando ocorrência com lembrete é salva
if (occurrence.reminder_at) {
  createTask({
    anchor: 'occurrence_followup',
    scheduled_for: occurrence.reminder_at,
    student_id: occurrence.student_id,
    template_code: 'OCC_FOLLOWUP'
  })
}
```

### **Recalcular Manual**
- Botão "Recalcular" no painel
- Processa todas as âncoras ativas
- Opção de dry-run para simular

## 📝 **Sistema de Variáveis**

### **Variáveis Básicas**
- `[Nome do Aluno]`: Nome completo do aluno
- `[Primeiro Nome]`: Apenas o primeiro nome
- `[Nome do Plano]`: Nome do plano contratado
- `[Valor do Plano]`: Valor mensal do plano
- `[Nome do Treinador]`: Nome do treinador principal
- `[Data Vencimento]`: Data de vencimento do contrato
- `[Data Aniversário]`: Data de aniversário do aluno
- `[Saudação Temporal]`: Bom dia/boa tarde/boa noite

### **Variáveis Avançadas**
- `[Link Anamnese]`: Link para preenchimento de anamnese
- `[Link Pagamento]`: Link para pagamento
- `[Dias Restantes]`: Dias até vencimento
- `[Progresso Semanal]`: Progresso da semana
- `[Meta Atual]`: Meta em andamento

### **Exemplo de Uso**
```
Template: "Olá [Primeiro Nome], [Saudação Temporal]! 
Seu plano [Nome do Plano] (R$ [Valor do Plano]) 
vence em [Dias Restantes] dias. 
Acesse: [Link Pagamento]"
```

## 🎛️ **Interface do Operador**

### **Kanban de Tarefas**
- **Colunas:** Pendente, Para Hoje, Enviadas, Snoozed
- **Ações:** Copiar, WhatsApp Web, Marcar Enviado, Snooze, Notas
- **Filtros:** Âncora, template, canal, período, treinador

### **Calendário**
- **Visões:** Dia, semana, mês
- **Mesmas ações** do Kanban
- **Filtros** por âncora/template/status

## 🔄 **Estados das Tarefas**

1. **pending**: Aguardando processamento
2. **due_today**: Para enviar hoje
3. **sent**: Enviada com sucesso
4. **snoozed**: Adiada (+1/+3/+7 dias)
5. **skipped**: Ignorada pelo operador
6. **failed**: Falha no envio

## 📊 **Métricas e Logs**

### **Logs de Atividade**
- Criação de tarefas
- Envios realizados
- Snoozes e skips
- Falhas e erros

### **Métricas de Performance**
- Tempo de processamento por âncora
- Taxa de sucesso de envio
- Volume de tarefas geradas
- Picos de atividade

## 🚀 **Próximos Passos**

1. **Implementar variáveis** personalizadas
2. **Criar sistema de** preview de mensagens
3. **Adicionar templates** padrão
4. **Configurar âncoras** automáticas
5. **Testar motor** com dados reais

---
**Data:** 12/09/2025  
**Status:** Documentação criada  
**Responsável:** Assistente AI
