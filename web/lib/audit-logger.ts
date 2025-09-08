import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type AuditAction = 
  | 'occurrence_created'
  | 'occurrence_updated' 
  | 'occurrence_closed'
  | 'occurrence_reminder_created'
  | 'occurrence_reminder_updated'
  | 'occurrence_reminder_cancelled'
  | 'occurrence_attachment_uploaded'
  | 'occurrence_attachment_deleted'

export interface AuditLogEntry {
  tenantId: string
  entity: string
  entityId: string
  action: string
  actorId?: string | null
  before?: Record<string, any> | null
  after: Record<string, any>
  meta?: Record<string, any> | null
}

export class AuditLogger {
  private supabase: any
  private admin: any

  constructor() {
    this.supabase = null
    this.admin = null
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  private async getAdmin() {
    if (!this.admin) {
      this.admin = createAdminClient()
    }
    return this.admin
  }

  async log(entry: AuditLogEntry): Promise<string | undefined> {
    const admin = await this.getAdmin()
    const { data, error } = await admin
      .from('audit_log')
      .insert({
        tenant_id: entry.tenantId,
        entity: entry.entity,
        entity_id: entry.entityId,
        action: entry.action,
        actor_id: entry.actorId ?? null,
        payload_before: entry.before ?? null,
        payload_after: entry.after,
        meta: entry.meta ?? null,
        created_at: new Date().toISOString()
      })
      .select('id')

    if (error) {
      const safe: any = {
        code: (error as any)?.code || 'db_error',
        message: (error as any)?.message || 'Falha ao inserir auditoria',
        details: (error as any)?.details || null,
        hint: (error as any)?.hint || null
      }
      const err: any = new Error(safe.message)
      Object.assign(err, safe)
      throw err
    }
    return Array.isArray(data) ? data[0]?.id : (data as any)?.id
  }

  async logOccurrenceUpdated(
    occurrenceId: string,
    actorId: string,
    tenantId: string,
    payload: {
      changes: Record<string, any>
      previousValues: Record<string, any>
    }
  ) {
    return await this.log({
      tenantId,
      entity: 'student_occurrence',
      entityId: occurrenceId,
      action: 'update',
      actorId,
      before: payload.previousValues,
      after: payload.changes,
      meta: { source: 'api', route: '/api/occurrences/[id]' }
    })
  }
}

export const auditLogger = new AuditLogger()
