# PRD - Módulo de Alunos v1.0

**Versão:** 1.0  
**Data de Criação:** 2025-01-28  
**Última Atualização:** 2025-01-28  
**Status:** ✅ Implementado  
**Responsável:** Equipe de Desenvolvimento

---

## 📋 Sumário Executivo

O Módulo de Alunos é o core do sistema Personal Global, permitindo o gerenciamento completo do cadastro de alunos, desde informações básicas até relacionamentos com profissionais, endereço, anexos e processos.

**Objetivo Principal:** Centralizar todas as informações e operações relacionadas aos alunos em uma interface intuitiva e eficiente.

---

## 🎯 Objetivos

### Objetivos de Negócio

1. **Centralizar Informações**: Ter um repositório único de dados dos alunos
2. **Facilitar Gestão**: Permitir criação, edição e exclusão rápida de alunos
3. **Rastreabilidade**: Manter histórico de ações e relacionamentos
4. **Escalabilidade**: Suportar academias com 100+ alunos ativos

### Objetivos de Usuário

1. **Cadastro Rápido**: Criar aluno em menos de 30 segundos
2. **Busca Eficiente**: Encontrar aluno em menos de 3 cliques
3. **Edição Intuitiva**: Atualizar dados sem confusão
4. **Transparência**: Ver claramente o status e responsável de cada aluno

---

## 👥 Personas e Casos de Uso

### Persona 1: Administrador/Gerente

**Perfil:**
- Responsável pela gestão geral da academia
- Acesso completo a todos os módulos
- Toma decisões sobre matrículas e processos

**Casos de Uso:**
1. Cadastrar novo aluno quando ele chega na academia
2. Atualizar status de aluno (onboarding → ativo → pausado)
3. Excluir aluno que cancelou contrato
4. Visualizar todos os alunos e seus respectivos treinadores
5. Buscar aluno por nome/email/telefone

### Persona 2: Treinador/Profissional

**Perfil:**
- Responsável direto por um grupo de alunos
- Acesso limitado aos seus alunos designados
- Foca em acompanhamento e relacionamento

**Casos de Uso:**
1. Ver lista dos seus alunos atribuídos
2. Editar dados de contato e observações
3. Acessar anexos (anamnese, diretrizes)
4. Criar ocorrências e mensagens
5. Atualizar foto do aluno

### Persona 3: Recepcionista

**Perfil:**
- Primeiro contato com novos alunos
- Responsável por cadastro inicial
- Acesso limitado a operações básicas

**Casos de Uso:**
1. Cadastrar novo aluno com dados básicos
2. Atualizar telefone e email
3. Visualizar status do aluno
4. Enviar formulário de onboarding

---

## 🏗️ Arquitetura de Informação

### Estrutura de Dados

```typescript
Student {
  // Identificação
  id: UUID
  name: string (obrigatório, 3-100 chars)
  email: string (obrigatório, formato válido)
  phone: string (obrigatório, 10-11 dígitos)
  status: 'onboarding' | 'active' | 'paused' | 'inactive'
  photo_url: string (opcional)
  
  // Dados Pessoais
  birth_date: date (opcional)
  gender: 'masculino' | 'feminino' | 'outro' (opcional)
  marital_status: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' (opcional)
  nationality: string (opcional)
  birth_place: string (opcional)
  
  // Endereço
  address: {
    zip_code: string (8 dígitos)
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string (2 chars - UF)
  } (opcional)
  
  // Relacionamentos
  trainer_id: UUID (treinador principal)
  responsibles: [
    {
      professional_id: UUID
      role: 'principal' | 'apoio' | 'nutricionista' | ...
    }
  ]
  
  // Configurações
  onboard_opt: 'nao_enviar' | 'enviar' | 'enviado'
  
  // Metadados
  org_id: UUID (tenant)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (soft delete)
}
```

---

## 🎨 Funcionalidades Detalhadas

### 1. LISTAGEM DE ALUNOS

**Rota:** `/app/students`

#### 1.1 Visualização em Cards (Padrão)

**Layout:**
- Grid responsivo: 1-5 colunas (mobile → desktop)
- Card compacto: 320px × 180px
- Densidade visual alta (GATE 10.4.2)

**Conteúdo do Card:**
- Avatar/ícone de usuário
- Nome do aluno (line-clamp-2)
- Nome do treinador principal (ou "Sem treinador")
- Badge de status (colorido)
- Email (truncado)
- Telefone (formatado)
- Data de criação
- Botões de ação rápida

**Estados:**
- Normal: Borda padrão
- Hover: Sombra elevada + translate
- Loading: Skeleton pulsante

#### 1.2 Visualização em Tabela

**Colunas:**
1. Nome (com avatar)
2. Email
3. Telefone
4. Status (badge)
5. Treinador
6. Criado em
7. Ações

**Funcionalidades:**
- Ordenação por coluna (futuro)
- Seleção múltipla (futuro)
- Exportação (futuro)

#### 1.3 Busca e Filtros

**Busca Inline:**
- Campo de texto com ícone de lupa
- Placeholder: "Buscar por nome, email ou telefone..."
- Debounce de 300ms
- Busca em 3 campos simultaneamente

**Filtros Avançados (Drawer):**
- Filtro por Status (dropdown)
- Filtro por Treinador (dropdown com busca)
- Busca por Nome (input adicional)
- Contador de filtros ativos (badge)
- Botões: "Limpar" e "Aplicar Filtros"

**Feedback:**
- EmptyState quando não há resultados
- Mensagem: "Nenhum aluno encontrado"
- Botão: "Novo Aluno"

#### 1.4 Performance

**Otimizações:**
- Skeleton loader durante carregamento
- Prefetch ao hover nos cards
- React Query para cache
- Paginação (50 alunos por página - futuro)

---

### 2. CADASTRO DE ALUNO

**Rota:** Modal em `/app/students`  
**Componente:** `StudentCreateModal`

#### 2.1 Campos do Formulário

**Obrigatórios:**
- Nome completo (min 3 chars)
- Email (formato válido)
- Telefone (10-11 dígitos com máscara)
- Status (padrão: Onboarding)

**Opcionais:**
- Upload de foto (processamento automático para quadrado)
- Data de nascimento
- Outros dados pessoais

#### 2.2 Validações

**Regras:**
- Nome: min 3, max 100 caracteres, não pode ser só espaços
- Email: formato RFC 5322, lowercase automático
- Telefone: 10-11 dígitos, formatação automática
- Foto: max 5MB, formatos JPG/PNG/WEBP

**Feedback:**
- Erros inline abaixo do campo
- Borda vermelha no campo com erro
- Toast ao salvar (sucesso/erro)

#### 2.3 Fluxo de Criação

```
1. Usuário clica "Novo Aluno"
2. Modal abre centralizado
3. Usuário preenche campos obrigatórios
4. [Opcional] Upload de foto
5. Usuário clica "Salvar"
6. Validação client-side (Zod)
7. Spinner no botão
8. POST /api/students
9. Validação server-side
10. Criação no banco (Supabase)
11. Toast de sucesso
12. Modal fecha
13. Listagem atualiza automaticamente (React Query)
```

---

### 3. EDIÇÃO DE ALUNO

**Rota:** `/app/students/{id}/edit`  
**Componente:** `StudentEditTabsV6`

#### 3.1 Layout da Tela

**Header:**
- Nome do aluno (editável inline - futuro)
- Badge de status
- Data de criação
- Dropdown "Anexos" (6 opções)
- Dropdown "Processos" (9 opções)

**Botões de Ação:**
1. **Cancelar** (outline, vermelho) - volta sem salvar
2. **Aplicar** (outline, padrão) - salva e permanece
3. **Salvar e Voltar** (primary) - salva e redireciona

**Body:**
- Tabs TOTVS-like: Identificação | Endereço | Responsáveis
- Conteúdo responsivo em grid

#### 3.2 Aba "Identificação"

**Card: Dados Pessoais**
- Nome completo *
- Email *
- Telefone * (com máscara)
- Status *
- Data de nascimento
- Gênero
- Estado civil
- Nacionalidade
- Local de nascimento
- Opção de onboarding

**Card: Foto do Aluno**
- Preview da foto atual (se existir)
- Botão "Carregar Foto"
- Processamento automático:
  - Redimensionamento para quadrado
  - Compressão inteligente
  - Preview imediato
- Feedback: toast com tamanho e % de compressão
- Botão "Remover Foto"

**Card: Informações do Sistema**
- ID do aluno (somente leitura)
- Data de criação (somente leitura)
- Data de atualização (somente leitura)

#### 3.3 Aba "Endereço"

**Campos (todos opcionais):**
- CEP (máscara XXXXX-XXX)
- Rua
- Número
- Complemento
- Bairro
- Cidade
- Estado (dropdown com UFs)

**Funcionalidade Futura:**
- Busca automática por CEP (ViaCEP API)
- Preenchimento automático de rua, bairro, cidade, estado

#### 3.4 Aba "Responsáveis"

**Treinador Principal:**
- Modal de busca de profissionais
- Filtro por nome
- Card com foto, nome e perfil
- Botão "X" para remover

**Treinadores de Apoio:**
- Múltiplos treinadores
- Mesmo modal de busca
- Lista de cards
- Botão "+" para adicionar mais

**Responsáveis Específicos:**
- Permite definir roles customizados
- Múltiplos roles por profissional
- Útil para nutricionistas, fisioterapeutas, etc.

#### 3.5 Salvamento

**Estratégias:**
1. **Aplicar**: Salva dados, permanece na tela
2. **Salvar e Voltar**: Salva dados, redireciona para listagem

**Validação:**
- Client-side: Zod schemas
- Server-side: Backend validation
- Feedback: toast + erros inline

**Loading States:**
- Spinner no botão clicado
- Disabled em todos os botões durante save
- Texto muda para "Salvando..."

---

### 4. EXCLUSÃO DE ALUNO

**Localização:** Menu "Processos" → "Excluir Aluno"

#### 4.1 Fluxo de Exclusão

```
1. Usuário clica "Excluir Aluno" (vermelho)
2. Modal de confirmação premium abre
3. Ícone de alerta vermelho
4. Título: "Excluir Aluno"
5. Nome do aluno destacado
6. Lista de consequências
7. Botão "Cancelar" (outline)
8. Botão "Sim, Excluir Aluno" (destructive)
9. Confirmação
10. Spinner no botão
11. DELETE /api/students/{id}
12. Soft delete (marca deleted_at)
13. Status muda para 'inactive'
14. Toast de sucesso
15. Modal fecha
16. Listagem atualiza automaticamente
17. Aluno desaparece da lista
```

#### 4.2 Soft Delete

**Vantagens:**
- Preserva histórico
- Permite restauração futura
- Mantém integridade referencial
- Auditoria completa

**Implementação:**
- Campo `deleted_at` marcado com timestamp
- Status automaticamente muda para `inactive`
- Filtro global: `deleted_at=is.null`

#### 4.3 Permissões (RBAC)

**Quem pode excluir:**
- ✅ Admin
- ✅ Manager
- ❌ Trainer
- ❌ Recepcionista

**Validação:**
- Client-side: Esconde opção se não autorizado (futuro)
- Server-side: Retorna 403 se sem permissão

---

### 5. AÇÕES RÁPIDAS

#### 5.1 Menu "Anexos" (Paperclip)

**Opções:**
1. **Ocorrências** → Abre modal de ocorrências do aluno
2. **Relacionamento** → Timeline de mensagens/ações
3. **Anamnese** → Visualiza/gera anamnese
4. **Diretriz** → Documento de diretrizes
5. **Treino** → Planos de treino
6. **Arquivos** → Documentos gerais

#### 5.2 Menu "Processos" (Settings)

**Opções:**
1. **Matricular Aluno** → Associa a plano/serviço
2. **Enviar Onboarding** → Envia formulário por email/WhatsApp
3. **Gerar Anamnese** → Cria nova anamnese
4. **Gerar Diretriz** → Cria nova diretriz
5. **Nova Ocorrência** → Registra ocorrência
6. **Enviar Mensagem** → Composer de mensagem
7. **Enviar E-mail** → Email direto
8. **WhatsApp** (submenu):
   - Criar contato
   - Criar grupo
9. **Excluir Aluno** (vermelho) → Exclusão com confirmação

---

## 🔌 Integrações

### APIs Utilizadas

#### 1. Supabase REST API

**Endpoints:**
- `GET /rest/v1/students` - Listar alunos
- `POST /rest/v1/students` - Criar aluno
- `PATCH /rest/v1/students?id=eq.{id}` - Atualizar aluno
- `GET /rest/v1/student_responsibles` - Buscar responsáveis

**Autenticação:**
- Service Role Key (server-side)
- Anon Key (client-side)

#### 2. Next.js API Routes

**Rotas:**
- `GET /api/students` - Proxy com tenant filtering
- `POST /api/students` - Criação com validação
- `GET /api/students/{id}` - Detalhes do aluno
- `PATCH /api/students/{id}` - Atualização
- `DELETE /api/students/{id}` - Soft delete

#### 3. Upload de Fotos

**Rota:** `POST /api/upload/photo`

**Processamento:**
1. Recebe arquivo via FormData
2. Valida tamanho e formato
3. Redimensiona para quadrado (800x800)
4. Comprime (qualidade 85%)
5. Upload para Supabase Storage
6. Retorna URL pública

---

## 🎨 Design System

### Componentes Utilizados

**Base (shadcn/ui):**
- Button
- Card
- Input
- Select
- Badge
- Dialog
- DropdownMenu
- Tabs
- Skeleton

**Customizados:**
- StudentCreateModal
- StudentEditTabsV6
- StudentCardActions
- StudentTableActions
- DeleteStudentModal
- ProfessionalSearchModal
- FilterDrawer

### Cores e Estados

**Status do Aluno:**
- Onboarding: Azul (`bg-blue-100 text-blue-700`)
- Ativo: Verde (`bg-green-100 text-green-700`)
- Pausado: Amarelo (`bg-yellow-100 text-yellow-700`)
- Inativo: Cinza (`bg-gray-100 text-gray-700`)

**Feedback:**
- Sucesso: Verde (`text-green-600`)
- Erro: Vermelho (`text-red-600`)
- Warning: Amarelo (`text-yellow-600`)
- Info: Azul (`text-blue-600`)

---

## ⚡ Performance

### Métricas de Performance

**Objetivos:**
- Time to Interactive (TTI): < 2s
- Listagem: Carrega em < 500ms
- Busca: Responde em < 300ms
- Salvamento: Completa em < 1s

### Otimizações Implementadas

1. **React Query**
   - Cache automático
   - Stale time: 5 minutos
   - Refetch on window focus

2. **Prefetch**
   - Dispara ao hover no card
   - Dados carregados antes do clique

3. **Debounce**
   - Busca: 300ms
   - Filtros: imediato (via React Query)

4. **Skeleton Loader**
   - 6 cards pulsantes
   - Melhora perceived performance

5. **Image Processing**
   - Redimensionamento client-side
   - Compressão antes do upload
   - Reduz tráfego de rede

---

## 🔒 Segurança

### Autenticação e Autorização

**Multi-tenancy:**
- Todos os alunos filtrados por `org_id`
- Context resolver valida tenant
- Middleware protege rotas

**RBAC:**
- Roles: admin, manager, trainer, receptionist
- Permissões granulares por ação
- Validação server-side obrigatória

### Validações

**Client-side (Zod):**
- Formato de dados
- Comprimento de strings
- Tipos de dados

**Server-side:**
- SQL injection protection (prepared statements)
- XSS protection (sanitização)
- CSRF protection (tokens)
- Rate limiting (futuro)

### Dados Sensíveis

**Proteção:**
- Senhas nunca armazenadas (uso Auth do Supabase)
- Tokens em httpOnly cookies
- HTTPS obrigatório em produção
- Logs não incluem dados pessoais

---

## 📊 Monitoramento

### Métricas de Uso

**KPIs:**
1. Tempo médio de cadastro
2. Taxa de conclusão de cadastro
3. Número de edições por aluno
4. Uso de busca vs. scroll
5. Taxa de cliques em ações rápidas

### Logs e Auditoria

**Eventos Registrados:**
- Criação de aluno
- Atualização de dados
- Exclusão (soft delete)
- Mudanças de status
- Associação de treinadores

**Formato:**
```json
{
  "event": "student.created",
  "user_id": "uuid",
  "org_id": "uuid",
  "student_id": "uuid",
  "timestamp": "2025-01-28T10:30:00Z",
  "metadata": {
    "name": "João Silva",
    "status": "onboarding"
  }
}
```

---

## 🧪 Testes

### Estratégia de Testes

**1. Testes Unitários** (Futuro)
- Validações Zod
- Funções helpers
- Componentes isolados

**2. Testes de Integração** (Futuro)
- Fluxo completo de cadastro
- Edição de dados
- Exclusão com confirmação

**3. Testes E2E** (Futuro)
- Playwright
- Smoke test: criar → editar → listar → excluir
- Critical path coverage

**4. Testes Manuais** (Atual)
- Checklist de 256 casos
- Validação visual
- Cross-browser testing

### Cobertura de Testes

**Atual:**
- Manual: 100% (via checklist)
- Automatizado: 0%

**Meta:**
- Manual: 80%
- Unitário: 70%
- Integração: 50%
- E2E: 30%

---

## 📱 Responsividade

### Breakpoints

- **Mobile**: < 768px (1 coluna)
- **Tablet**: 768-1024px (2-3 colunas)
- **Desktop**: > 1024px (3-5 colunas)

### Adaptações

**Mobile:**
- Menu hamburger
- Cards empilhados
- Formulário scrollável
- Drawer full-screen

**Tablet:**
- Grid 2-3 colunas
- Sidebar colapsável
- Drawer 80% da tela

**Desktop:**
- Grid 3-5 colunas
- Sidebar fixa
- Drawer 400px
- Hover interactions

---

## 🚀 Roadmap

### v1.1 (Próximo Sprint)

- [ ] Paginação real (50 alunos/página)
- [ ] Exportação para Excel/CSV
- [ ] Busca avançada (múltiplos filtros)
- [ ] Histórico de alterações

### v1.2 (Futuro)

- [ ] Importação em massa (CSV)
- [ ] Virtual scrolling
- [ ] Ordenação por coluna
- [ ] Seleção múltipla
- [ ] Ações em lote

### v2.0 (Futuro Distante)

- [ ] Busca por CEP com preenchimento automático
- [ ] Integração com WhatsApp Business API
- [ ] Notificações push
- [ ] App mobile nativo

---

## 📚 Referências

### Documentos Relacionados

- `Checklist_Modulo_Alunos.md` - Casos de teste
- `Padrão_Botões.md` - Guidelines de botões
- `Padrão_Filtros.md` - Guidelines de filtros
- `Padronizacao.txt` - Padrões gerais

### Tecnologias

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zod
- React Query
- Supabase

---

**Versão do Documento:** 1.0  
**Última Atualização:** 2025-01-28  
**Próxima Revisão:** Após cada sprint ou release major

