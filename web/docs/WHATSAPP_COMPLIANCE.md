# WhatsApp Business API - Compliance e Segurança

## Visão Geral

Este documento define as políticas e práticas de segurança para integração com WhatsApp Business API, garantindo conformidade com as políticas do WhatsApp e prevenindo suspensão de contas.

## Políticas do WhatsApp Business API

### Limites e Restrições

- **Limite de Mensagens**: Máximo 1000 mensagens por dia por número
- **Rate Limiting**: Máximo 20 mensagens por segundo
- **Grupos**: Máximo 256 participantes por grupo
- **Mídia**: Máximo 16MB por arquivo

### Proibições Críticas

- ❌ **Spam**: Envio de mensagens não solicitadas
- ❌ **Automação Excessiva**: Uso de bots sem controle humano
- ❌ **Violação de Privacidade**: Compartilhamento não autorizado de dados
- ❌ **Conteúdo Inadequado**: Mensagens com conteúdo ofensivo ou ilegal

### Requisitos de Opt-in

- ✅ **Consentimento Explícito**: Usuário deve concordar antes de receber mensagens
- ✅ **Opt-out**: Usuário deve poder cancelar a qualquer momento
- ✅ **Finalidade Clara**: Especificar o propósito das mensagens

## Implementação Atual

### Rate Limiting Implementado

#### Frontend (Cliente)
```typescript
// Limite: 1 grupo por minuto
const RATE_LIMIT_MS = 60000 // 1 minuto entre criações
const now = Date.now()
if (now - lastCreationTime < RATE_LIMIT_MS) {
  const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastCreationTime)) / 1000)
  setError(`Aguarde ${remainingSeconds} segundos antes de criar outro grupo.`)
  return
}
```

#### Backend (API)
- Rate limiting por usuário: máximo 10 requisições por minuto
- Timeout configurado: máximo 30 segundos por requisição
- Validação de payload: sanitização de dados antes do envio

### Sistema de Auditoria

#### Logs Estruturados
```typescript
await auditLog('CREATE_GROUP_ATTEMPT', {
  groupName: name,
  participants: normalizedParticipants,
  success: false
})

await auditLog('CREATE_GROUP_RESULT', {
  groupName: name,
  participants: normalizedParticipants,
  success: response.ok,
  error: response.ok ? undefined : errorMessage
})
```

#### Informações Registradas
- Timestamp da operação
- Nome do grupo
- Lista de participantes (números mascarados)
- Resultado (sucesso/falha)
- Mensagem de erro (se aplicável)

### Confirmação Dupla

#### Interface de Confirmação
```tsx
{showConfirmation && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
    <div className="flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-semibold text-yellow-900 mb-1">Confirmar Criação de Grupo</h4>
        <p className="text-sm text-yellow-800 mb-2">
          Você está prestes a criar um grupo no WhatsApp com {selectedPhones.length} participante(s).
          Esta ação não pode ser desfeita automaticamente.
        </p>
        <p className="text-xs text-yellow-700">
          Grupo: <strong>{groupName}</strong>
        </p>
      </div>
    </div>
  </div>
)}
```

#### Fluxo de Confirmação
1. **Primeira tentativa**: Exibe modal de confirmação
2. **Segunda tentativa**: Executa a criação do grupo
3. **Reset automático**: Estado limpo quando modal fecha

### Controle de Acesso

#### Variável de Ambiente
```env
# Desabilitar feature completamente se necessário
NEXT_PUBLIC_WA_CREATE_GROUP_ENABLED=false
```

#### Renderização Condicional
```tsx
{ (process.env.NEXT_PUBLIC_WA_CREATE_GROUP_ENABLED === 'true') && whatsappCreateGroupOpen && (
  <WhatsAppCreateGroupModal
    open={whatsappCreateGroupOpen}
    onOpenChange={setWhatsappCreateGroupOpen}
    studentId={studentId}
    studentName={studentName}
    studentPhone={studentPhone}
  />
)}
```

## Procedimentos de Emergência

### Desabilitar Feature Rapidamente

1. **Via Variável de Ambiente**:
   ```env
   NEXT_PUBLIC_WA_CREATE_GROUP_ENABLED=false
   ```

2. **Via Deploy**:
   - Alterar variável no ambiente de produção
   - Fazer deploy imediato
   - Feature fica indisponível em ~2 minutos

### Contatos de Suporte

#### Z-API (Provedor)
- **Email**: suporte@z-api.io
- **Telefone**: +55 11 99999-9999
- **Chat**: https://z-api.io/suporte

#### WhatsApp Business
- **Centro de Ajuda**: https://business.whatsapp.com/support
- **Status da API**: https://status.whatsapp.com/

### Processo de Recuperação de Conta Suspensa

1. **Identificar Causa**:
   - Analisar logs de auditoria
   - Verificar rate limits
   - Revisar conteúdo das mensagens

2. **Documentar Evidências**:
   - Screenshots dos logs
   - Relatório de uso
   - Políticas implementadas

3. **Contatar Suporte**:
   - Enviar evidências via email
   - Explicar medidas preventivas
   - Solicitar reativação

4. **Implementar Correções**:
   - Ajustar rate limits se necessário
   - Revisar validações
   - Atualizar políticas

## Checklist de Segurança

### Antes de Cada Deploy
- [ ] Verificar rate limits configurados
- [ ] Validar logs de auditoria ativos
- [ ] Testar confirmação dupla
- [ ] Confirmar variável de controle

### Monitoramento Diário
- [ ] Revisar logs de auditoria
- [ ] Verificar taxa de erro das APIs
- [ ] Monitorar uso de rate limits
- [ ] Validar consentimentos

### Semanalmente
- [ ] Analisar métricas de uso
- [ ] Revisar políticas de compliance
- [ ] Atualizar documentação se necessário
- [ ] Treinar equipe sobre procedimentos

### Mensalmente
- [ ] Auditoria completa do sistema
- [ ] Revisão de logs por período
- [ ] Atualização de políticas
- [ ] Teste de procedimentos de emergência

## Configurações de Produção

### Variáveis de Ambiente Obrigatórias

```env
# WhatsApp API - Rate Limiting
WA_MAX_GROUPS_PER_DAY=10
WA_MAX_CONTACTS_PER_DAY=50
WA_RATE_LIMIT_WINDOW_MS=60000

# Controle de Feature
NEXT_PUBLIC_WA_CREATE_GROUP_ENABLED=true

# Z-API Credentials
ZAPI_INSTANCE_ID=your_instance_id
ZAPI_TOKEN=your_token
ZAPI_CLIENT_TOKEN=your_client_token
```

### Configurações de Log

```typescript
// Logs de auditoria retidos por 90 dias
const AUDIT_RETENTION_DAYS = 90

// Máscara de dados sensíveis
const maskPhone = (phone: string) => {
  return phone.replace(/(\d{2})(\d{4})(\d{4})$/, '$1****$3')
}
```

## Endpoints WhatsApp Auditados

### ✅ Conformes
- `/api/wa/create-group` - Criação de grupos com auditoria
- `/api/wa/create-contact` - Criação de contatos

### 🔄 Em Revisão
- `/api/whatsapp/setup-group` - Setup de grupos
- `/api/whatsapp/add-contact` - Adicionar contatos
- `/api/whatsapp/group` - Operações de grupo

### Checklist de Compliance por Endpoint
- [ ] Rate limiting implementado
- [ ] Validação de consentimento
- [ ] Log de auditoria
- [ ] Tratamento de erros seguro
- [ ] Validação de permissões
- [ ] Timeout configurado

## Monitoramento e Alertas

### Métricas Críticas
- Taxa de erro > 5%
- Rate limit atingido > 3x por hora
- Tempo de resposta > 30s
- Falhas de autenticação

### Alertas Configurados
- Email para administradores
- Slack para equipe de desenvolvimento
- Dashboard em tempo real

## Conclusão

Esta implementação garante conformidade com as políticas do WhatsApp Business API, minimizando riscos de suspensão e protegendo a reputação da organização.

Para dúvidas ou sugestões de melhoria, consulte a equipe de desenvolvimento ou abra uma issue no repositório.

---

**Última atualização**: 10/10/2025  
**Responsável**: Equipe de Desenvolvimento  
**Próxima revisão**: 10/11/2025
