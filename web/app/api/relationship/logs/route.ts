import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, student_id, metadata } = body

    if (!action || !student_id) {
      return NextResponse.json(
        { error: 'action and student_id are required' },
        { status: 400 }
      )
    }

    // Mapear ações customizadas para ações válidas da constraint
    const actionMap: Record<string, string> = {
      'vcard_downloaded': 'created',
      'whatsapp_opened': 'created', 
      'wa_add_contact_success': 'sent',
      'wa_add_contact_error': 'failed'
    }

    const validAction = actionMap[action] || action

    // Verificar se a ação é válida
    const validActions = ['created', 'sent', 'snoozed', 'skipped', 'failed', 'recalculated']
    if (!validActions.includes(validAction)) {
      console.warn(`Ação inválida mapeada: ${action} -> ${validAction}`)
    }

    const supabase = await createClient()

    // Inserir log
    const { error } = await supabase
      .from('relationship_logs')
      .insert({
        student_id,
        action: validAction,
        channel: 'whatsapp',
        meta: {
          ...metadata,
          original_action: action // Preservar ação original nos metadados
        }
      })

    if (error) {
      console.error('Erro ao salvar log:', error)
      return NextResponse.json(
        { error: 'Failed to save log' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
