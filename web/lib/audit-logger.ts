// GATE S4: Utilitário para auditoria do módulo de anamnese

interface AuditLogEntry {
  organization_id: string
  user_id: string
  action: 'create' | 'update' | 'delete' | 'publish' | 'set_default'
  resource_type: 'template' | 'template_version' | 'question' | 'guideline' | 'guideline_version' | 'rule'
  resource_id: string
  payload_before?: any
  payload_after?: any
  metadata?: {
    ip_address?: string
    user_agent?: string
    [key: string]: any
  }
}

export class AuditLogger {
  private static instance: AuditLogger
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  static getInstance(supabase: any): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger(supabase)
    }
    return AuditLogger.instance
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.supabase
        .from('anamnesis_audit_logs')
        .insert({
          organization_id: entry.organization_id,
          user_id: entry.user_id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          payload_before: entry.payload_before || null,
          payload_after: entry.payload_after || null,
          metadata: entry.metadata || null
        })
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error)
      // Não falhar a operação principal por causa da auditoria
    }
  }

  // Métodos de conveniência para ações comuns
  async logTemplatePublish(organizationId: string, userId: string, templateId: string, versionId: string, before: any, after: any) {
    await this.log({
      organization_id: organizationId,
      user_id: userId,
      action: 'publish',
      resource_type: 'template_version',
      resource_id: versionId,
      payload_before: before,
      payload_after: after,
      metadata: { template_id: templateId }
    })
  }

  async logSetDefault(organizationId: string, userId: string, resourceType: 'template' | 'guideline', resourceId: string, before: any, after: any) {
    await this.log({
      organization_id: organizationId,
      user_id: userId,
      action: 'set_default',
      resource_type: resourceType === 'template' ? 'template_version' : 'guideline_version',
      resource_id: resourceId,
      payload_before: before,
      payload_after: after
    })
  }

  async logQuestionCreate(organizationId: string, userId: string, questionId: string, templateVersionId: string, payload: any) {
    await this.log({
      organization_id: organizationId,
      user_id: userId,
      action: 'create',
      resource_type: 'question',
      resource_id: questionId,
      payload_after: payload,
      metadata: { template_version_id: templateVersionId }
    })
  }

  async logQuestionUpdate(organizationId: string, userId: string, questionId: string, before: any, after: any) {
    await this.log({
      organization_id: organizationId,
      user_id: userId,
      action: 'update',
      resource_type: 'question',
      resource_id: questionId,
      payload_before: before,
      payload_after: after
    })
  }

  async logRuleCreate(organizationId: string, userId: string, ruleId: string, guidelineVersionId: string, payload: any) {
    await this.log({
      organization_id: organizationId,
      user_id: userId,
      action: 'create',
      resource_type: 'rule',
      resource_id: ruleId,
      payload_after: payload,
      metadata: { guideline_version_id: guidelineVersionId }
    })
  }

  async logRuleUpdate(organizationId: string, userId: string, ruleId: string, before: any, after: any) {
    await this.log({
      organization_id: organizationId,
      user_id: userId,
      action: 'update',
      resource_type: 'rule',
      resource_id: ruleId,
      payload_before: before,
      payload_after: after
    })
  }
}