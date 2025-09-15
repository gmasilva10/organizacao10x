# Gate A-10.2.5 — WhatsApp Processos

## Objetivo
Implementar funcionalidades de WhatsApp no menu "Alunos ▸ Editar ▸ Processos" com duas opções:
- **Criar contato**: Gera vCard do aluno e abre chat no WhatsApp Web
- **Criar grupo (assistido)**: Wizard de 3 etapas para criação de grupo no WhatsApp

## Implementação Realizada

### 1. Utilitários Criados

#### `web/utils/phone.ts`
- `normalizeToE164()`: Normaliza telefones para formato E.164
- `isValidForWhatsApp()`: Valida se número é compatível com WhatsApp
- Suporte a DDD padrão da organização (11) e fallbacks

#### `web/utils/vcard.ts`
- `buildStudentVCard()`: Gera vCard 3.0 para alunos
- `buildMultipleVCards()`: Gera múltiplos vCards para grupos
- `downloadVCard()`: Download automático de vCards

#### `web/utils/wa.ts`
- `waChatUrl()`: Gera URLs do WhatsApp Web
- `openWhatsAppChat()`: Abre chat individual
- `openWhatsAppWeb()`: Abre WhatsApp Web principal
- `copyToClipboard()`: Copia texto para área de transferência

### 2. Constantes

#### `web/constants/whatsapp.ts`
```typescript
export const ORG_DEFAULT_DDD = "11"
export const DEFAULT_CONTACT_GREETING = "Olá {PrimeiroNome}, tudo bem?"
export const DEFAULT_GROUP_NAME_TEMPLATE = "{OrgCurta} · {PrimeiroNome} {InicialSobrenome}"
export const DEFAULT_GROUP_WELCOME = "Olá, pessoal! Este é o grupo de acompanhamento do(a) {PrimeiroNome}. Bem-vindos! 👋"
export const WHATSAPP_ACTIONS = {
  CONTACT_VCARD_GENERATED: 'contact_vcard_generated',
  WHATSAPP_CHAT_OPENED: 'whatsapp_chat_opened',
  WHATSAPP_GROUP_ASSISTED_STARTED: 'whatsapp_group_assisted_started',
  WHATSAPP_GROUP_ASSISTED_COMPLETED: 'whatsapp_group_assisted_completed'
} as const
```

### 3. Componentes

#### `web/components/whatsapp/WhatsAppContactCreator.tsx`
- Componente invisível que executa automaticamente
- Normaliza telefone, gera vCard, abre chat
- Logs via `relationship_logs`

#### `web/components/whatsapp/WhatsAppGroupWizard.tsx`
- Wizard de 3 etapas:
  1. **Participantes**: Seleção de aluno + responsáveis ativos
  2. **Nome & Mensagem**: Configuração do grupo
  3. **Executar**: Instruções para criação manual no WhatsApp Web
- Suporte a múltiplos telefones e vCards
- Validação de consentimento

#### `web/components/students/ProcessosDropdown.tsx` (Modificado)
- Adicionado grupo "WhatsApp" com submenu
- Integração com novos componentes
- Lógica de "Criar contato" implementada diretamente

#### `web/components/students/StudentEditTabsV6.tsx` (Modificado)
- Adicionado `ProcessosDropdown` na interface
- Passagem de dados necessários (telefone, email, responsáveis)

### 4. Funcionalidades Implementadas

#### Criar Contato
- ✅ Normalização de telefone para E.164
- ✅ Geração de vCard 3.0
- ✅ Download automático do vCard
- ✅ Abertura de chat no WhatsApp Web
- ✅ Mensagem padrão personalizada
- ✅ Logs de auditoria
- ✅ Tratamento de erros e validações

#### Criar Grupo (Assistido)
- ✅ Seleção automática de participantes
- ✅ Badges para participantes sem telefone
- ✅ Geração de vCards em lote
- ✅ Cópia de números para área de transferência
- ✅ Sugestão de nome do grupo
- ✅ Mensagem de boas-vindas personalizada
- ✅ Instruções para criação manual
- ✅ Validação de consentimento
- ✅ Logs de auditoria

### 5. Segurança e RLS
- ✅ Respeito ao `tenant_id` em todas as consultas
- ✅ Validação de permissões de acesso
- ✅ Mascaramento de números de telefone nos logs
- ✅ Uso apenas de APIs oficiais do WhatsApp

### 6. Acessibilidade (A11y)
- ✅ Navegação por teclado
- ✅ Foco retorna ao item pai após fechar modais
- ✅ Atributos `aria-*` apropriados
- ✅ Suporte a leitores de tela

### 7. UX/UI
- ✅ Design consistente com padrões existentes
- ✅ Ícones apropriados (MessageCircle, IdCard, Users)
- ✅ Feedback visual com toasts
- ✅ Estados de loading
- ✅ Tratamento de erros amigável

## Evidências de Teste

### Screenshots
- [ ] Screenshot do menu Processos com grupo WhatsApp
- [ ] Screenshot do wizard de criação de grupo
- [ ] Screenshot do vCard gerado
- [ ] Screenshot do chat aberto no WhatsApp Web

### Logs de Auditoria
- [ ] Log `contact_vcard_generated` no `relationship_logs`
- [ ] Log `whatsapp_chat_opened` no `relationship_logs`
- [ ] Log `whatsapp_group_assisted_started` no `relationship_logs`
- [ ] Log `whatsapp_group_assisted_completed` no `relationship_logs`

### Console Limpo
- [ ] Verificação de ausência de erros no console
- [ ] Verificação de ausência de warnings desnecessários

## Arquivos Modificados/Criados

### Novos Arquivos
- `web/constants/whatsapp.ts`
- `web/utils/phone.ts`
- `web/utils/vcard.ts`
- `web/utils/wa.ts`
- `web/components/whatsapp/WhatsAppContactCreator.tsx`
- `web/components/whatsapp/WhatsAppGroupWizard.tsx`

### Arquivos Modificados
- `web/components/students/ProcessosDropdown.tsx`
- `web/components/students/StudentEditTabsV6.tsx`

## Próximos Passos
1. Testes manuais completos
2. Coleta de evidências visuais
3. Verificação de logs de auditoria
4. Testes de acessibilidade
5. Validação de performance

## Status
✅ **IMPLEMENTAÇÃO CONCLUÍDA**
- Todas as funcionalidades foram implementadas
- Componentes integrados na interface
- Logs de auditoria configurados
- Segurança e RLS implementados
