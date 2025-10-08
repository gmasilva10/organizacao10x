# Módulo de Relacionamento - Documentação da API

## Visão Geral

O módulo de Relacionamento permite gerenciar tarefas de comunicação com alunos através de diferentes canais (WhatsApp, SMS, Email). O sistema oferece visualizações em Kanban e Calendário, com filtros avançados e ações em tempo real.

## Estrutura da API

### Base URL
```
/api/relationship
```

## Endpoints

### 1. Listar Tarefas
**GET** `/api/relationship/tasks`

Lista tarefas de relacionamento com filtros e paginação.

#### Parâmetros de Query

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `page` | number | Página atual (padrão: 1) | `1` |
| `page_size` | number | Itens por página (padrão: 20, máx: 100) | `20` |
| `status` | string | Status da tarefa | `pending`, `sent`, `skipped`, `postponed` |
| `anchor` | string | Âncora da tarefa | `manual`, `onboarding`, `sale_close` |
| `template_code` | string | Código do template | `welcome_message` |
| `channel` | string | Canal de comunicação | `whatsapp`, `sms`, `email` |
| `student_id` | string | ID do aluno | `uuid` |
| `scheduled_from` | string | Data de agendamento (início) | `2025-01-01T00:00:00Z` |
| `scheduled_to` | string | Data de agendamento (fim) | `2025-01-31T23:59:59Z` |
| `created_from` | string | Data de criação (início) | `2025-01-01T00:00:00Z` |
| `created_to` | string | Data de criação (fim) | `2025-01-31T23:59:59Z` |
| `sort_by` | string | Campo para ordenação | `scheduled_for`, `created_at` |
| `sort_order` | string | Direção da ordenação | `asc`, `desc` |

#### Resposta

```json
{
  "tasks": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "template_code": "welcome_message",
      "anchor": "onboarding",
      "scheduled_for": "2025-01-15T10:00:00Z",
      "channel": "whatsapp",
      "status": "pending",
      "payload": {
        "mode": "template",
        "message": "Olá [Nome], bem-vindo!",
        "template_version": "1.0",
        "classification_tag": "welcome"
      },
      "variables_used": {
        "Nome": "João Silva"
      },
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-01T10:00:00Z",
      "created_by": "system",
      "students": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@email.com",
        "phone": "+5511999999999"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 100,
    "total_pages": 5
  },
  "filters": {
    "status": "pending",
    "anchor": "all",
    "template_code": "all",
    "channel": "whatsapp",
    "student_id": null,
    "scheduled_from": "2025-01-01T00:00:00Z",
    "scheduled_to": "2025-01-31T23:59:59Z",
    "created_from": null,
    "created_to": null,
    "page": 1,
    "limit": 20,
    "sort_by": "scheduled_for",
    "sort_order": "asc"
  },
  "performance": {
    "query_time_ms": 45,
    "total_time_ms": 67
  }
}
```

### 2. Criar Tarefa
**POST** `/api/relationship/tasks`

Cria uma nova tarefa de relacionamento.

#### Body

```json
{
  "student_id": "uuid",
  "template_code": "welcome_message",
  "anchor": "manual",
  "scheduled_for": "2025-01-15T10:00:00Z",
  "channel": "whatsapp",
  "status": "pending",
  "payload": {
    "mode": "free",
    "message": "Olá [Nome], como está o treino?",
    "template_version": null,
    "classification_tag": null
  },
  "variables_used": ["Nome"],
  "created_by": "manual"
}
```

#### Resposta

```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "student_id": "uuid",
    "template_code": "welcome_message",
    "anchor": "manual",
    "scheduled_for": "2025-01-15T10:00:00Z",
    "channel": "whatsapp",
    "status": "pending",
    "payload": {
      "mode": "free",
      "message": "Olá [Nome], como está o treino?",
      "template_version": null,
      "classification_tag": null
    },
    "variables_used": ["Nome"],
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z",
    "created_by": "manual",
    "org_id": "uuid"
  },
  "performance": {
    "total_time_ms": 23
  }
}
```

### 3. Atualizar Tarefa
**PATCH** `/api/relationship/tasks`

Atualiza o status de uma tarefa.

#### Body

```json
{
  "task_id": "uuid",
  "status": "sent",
  "notes": "Enviada com sucesso via WhatsApp"
}
```

#### Resposta

```json
{
  "success": true,
  "message": "Tarefa atualizada com sucesso",
  "task_id": "uuid",
  "updated_status": "sent"
}
```

### 4. Excluir Tarefa
**DELETE** `/api/relationship/tasks/{id}`

Exclui uma tarefa (soft delete).

#### Resposta

```json
{
  "success": true,
  "message": "Tarefa excluída com sucesso",
  "task_id": "uuid"
}
```

### 5. Desfazer Ação
**POST** `/api/relationship/tasks/{id}/undo`

Desfaz uma ação recente (exclusão ou pulo) dentro de 5 segundos.

#### Body

```json
{
  "previous_status": "pending",
  "previous_scheduled_for": "2025-01-15T10:00:00Z"
}
```

#### Resposta

```json
{
  "success": true,
  "message": "Ação desfeita com sucesso",
  "task_id": "uuid",
  "previous_status": "deleted",
  "restored_status": "pending",
  "elapsed_seconds": 3
}
```

## Filtros Disponíveis

### Status
- `pending`: Pendente de envio
- `sent`: Enviada
- `failed`: Falhou no envio
- `skipped`: Pulada
- `postponed`: Adiada
- `completed`: Concluída

### Âncoras
- `manual`: Manual
- `onboarding`: Onboarding
- `sale_close`: Pós-venda
- `recurrent`: Recorrente
- `birthday`: Aniversário
- `anniversary`: Aniversário de Cliente
- `churn_prevention`: Prevenção de Churn
- `reactivation`: Reativação
- `feedback`: Feedback
- `promotion`: Promoção
- `event`: Evento
- `other`: Outro

### Canais
- `whatsapp`: WhatsApp
- `sms`: SMS
- `email`: Email

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `400` | Parâmetros inválidos |
| `401` | Não autorizado |
| `404` | Recurso não encontrado |
| `500` | Erro interno do servidor |

## Headers de Resposta

| Header | Descrição |
|--------|-----------|
| `X-Query-Time` | Tempo de consulta em ms |
| `X-Total-Count` | Total de registros |
| `X-Page` | Página atual |
| `X-Total-Pages` | Total de páginas |
| `Cache-Control` | Controle de cache |

## Rate Limiting

- **GET**: 100 requests/minuto
- **POST/PATCH/DELETE**: 50 requests/minuto

## Autenticação

Todas as requisições requerem autenticação via cookie de sessão. O sistema utiliza `org_id` para isolamento de dados entre organizações.

## Exemplos de Uso

### Buscar tarefas pendentes para hoje
```bash
curl -X GET "/api/relationship/tasks?status=pending&scheduled_from=2025-01-15T00:00:00Z&scheduled_to=2025-01-15T23:59:59Z"
```

### Criar tarefa manual
```bash
curl -X POST "/api/relationship/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "uuid",
    "anchor": "manual",
    "scheduled_for": "2025-01-15T10:00:00Z",
    "channel": "whatsapp",
    "payload": {
      "mode": "free",
      "message": "Olá [Nome], como está o treino hoje?"
    }
  }'
```

### Marcar tarefa como enviada
```bash
curl -X PATCH "/api/relationship/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "uuid",
    "status": "sent",
    "notes": "Enviada via WhatsApp Web"
  }'
```

## Feature Flags

### REL_KANBAN_SIMPLE
- **Valor**: `1` para ativar, `0` ou ausente para desativar
- **Descrição**: Usa versão simplificada do Kanban para evitar erros de TypeError
- **Uso**: `NEXT_PUBLIC_REL_KANBAN_SIMPLE=1`

### DEBUG_REL
- **Valor**: `1` para ativar, `0` ou ausente para desativar
- **Descrição**: Ativa logs detalhados para depuração
- **Uso**: `NEXT_PUBLIC_DEBUG_REL=1`

## Troubleshooting

### Erro "Cannot read properties of undefined (reading 'toString')"
- **Causa**: Valores undefined sendo convertidos para string
- **Solução**: Usar `safeQueryString()` helper ou ativar `REL_KANBAN_SIMPLE=1`

### Tarefas não aparecem no frontend
- **Causa**: Problema com `org_id` ou RLS
- **Solução**: Verificar se o usuário tem acesso à organização

### Performance lenta
- **Causa**: Queries sem índices ou muitos dados
- **Solução**: Usar paginação e filtros específicos
