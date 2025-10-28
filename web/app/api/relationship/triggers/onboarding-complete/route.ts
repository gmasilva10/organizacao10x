/**
 * Trigger: Onboarding Complete → First Workout
 * 
 * Dispara automaticamente a criação de uma tarefa de relacionamento
 * quando um aluno completa o onboarding.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface OnboardingCompletePayload {
  student_id: string
  completed_at: string
  org_id: string
  first_workout_scheduled_at?: string
}

export async function POST(request: NextRequest) {
  try {
    // Este é um trigger interno, não precisa de autenticação complexa
    const payload: OnboardingCompletePayload = await request.json()
    
    if (!payload.student_id || !payload.org_id || !payload.completed_at) {
      return NextResponse.json({ 
        error: 'Missing required fields: student_id, org_id, completed_at' 
      }, { status: 400 })
    }

    console.log('🔄 [onboarding-trigger] Processando conclusão de onboarding:', {
      student_id: payload.student_id,
      org_id: payload.org_id,
      completed_at: payload.completed_at
    })

    // Buscar templates ativos para first_workout
    const { data: templates, error: templatesError } = await supabase
      .from('relationship_templates_v2')
      .select('*')
      .eq('org_id', payload.org_id)
      .eq('active', true)
      .eq('anchor', 'first_workout')

    if (templatesError) {
      console.error('❌ [onboarding-trigger] Erro ao buscar templates:', templatesError)
      return NextResponse.json({ 
        error: 'Failed to fetch templates' 
      }, { status: 500 })
    }

    if (!templates || templates.length === 0) {
      console.log('⚠️ [onboarding-trigger] Nenhum template ativo encontrado para first_workout')
      return NextResponse.json({ 
        success: true, 
        message: 'No active templates found for first_workout',
        tasks_created: 0
      })
    }

    // Buscar dados do aluno
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email, phone, first_workout_date, org_id')
      .eq('id', payload.student_id)
      .eq('org_id', payload.org_id)
      .single()

    if (studentError || !student) {
      console.error('❌ [onboarding-trigger] Erro ao buscar aluno:', studentError)
      return NextResponse.json({ 
        error: 'Student not found' 
      }, { status: 404 })
    }

    let tasksCreated = 0
    const errors: string[] = []

    // Processar cada template
    for (const template of templates) {
      try {
        // Calcular data agendada baseada no offset
        let scheduledDate: Date
        
        if (template.temporal_offset_days !== null && template.temporal_offset_days !== undefined) {
          // Usar offset temporal
          scheduledDate = new Date(payload.completed_at)
          scheduledDate.setDate(scheduledDate.getDate() + template.temporal_offset_days)
        } else {
          // Usar offset sugerido (ex: "+1d", "-1d")
          const offsetMatch = template.suggested_offset?.match(/^([+-]?)(\d+)d/)
          if (offsetMatch) {
            const sign = offsetMatch[1] === '-' ? -1 : 1
            const days = parseInt(offsetMatch[2]) * sign
            scheduledDate = new Date(payload.completed_at)
            scheduledDate.setDate(scheduledDate.getDate() + days)
          } else {
            // Default: +1 dia
            scheduledDate = new Date(payload.completed_at)
            scheduledDate.setDate(scheduledDate.getDate() + 1)
          }
        }

        // Verificar se já existe tarefa para este aluno/template/data
        const { data: existingTask } = await supabase
          .from('relationship_tasks')
          .select('id')
          .eq('student_id', payload.student_id)
          .eq('template_code', template.code)
          .eq('anchor', 'first_workout')
          .gte('scheduled_for', new Date(scheduledDate.setHours(0, 0, 0, 0)).toISOString())
          .lt('scheduled_for', new Date(scheduledDate.setHours(23, 59, 59, 999)).toISOString())
          .single()

        if (existingTask) {
          console.log('⚠️ [onboarding-trigger] Tarefa já existe para template:', template.code)
          continue
        }

        // Renderizar mensagem com variáveis
        const renderedMessage = await renderMessageWithVariables(
          template.message_v1,
          student,
          payload.completed_at
        )

        // Criar tarefa de relacionamento
        const { error: insertError } = await supabase
          .from('relationship_tasks')
          .insert({
            org_id: payload.org_id,
            student_id: payload.student_id,
            template_code: template.code,
            anchor: 'first_workout',
            scheduled_for: scheduledDate.toISOString(),
            channel: template.channel_default || 'whatsapp',
            status: 'pending',
            payload: {
              message: renderedMessage,
              student_name: student.name,
              student_email: student.email,
              student_phone: student.phone,
              onboarding_completed_at: payload.completed_at
            },
            variables_used: template.variables || [],
            created_by: 'system_onboarding_trigger'
          })

        if (insertError) {
          console.error('❌ [onboarding-trigger] Erro ao criar tarefa:', insertError)
          errors.push(`Erro ao criar tarefa para template ${template.code}: ${insertError.message}`)
        } else {
          tasksCreated++
          console.log('✅ [onboarding-trigger] Tarefa criada:', {
            template_code: template.code,
            scheduled_for: scheduledDate.toISOString(),
            channel: template.channel_default
          })
        }
      } catch (error) {
        console.error('❌ [onboarding-trigger] Erro ao processar template:', error)
        errors.push(`Erro ao processar template ${template.code}: ${(error as any)?.message || String(error)}`)
      }
    }

    // Atualizar onboarding_history com first_workout_scheduled_at
    if (tasksCreated > 0) {
      const { error: updateError } = await supabase
        .from('onboarding_history')
        .update({
          first_workout_scheduled_at: new Date().toISOString()
        })
        .eq('student_id', payload.student_id)
        .eq('org_id', payload.org_id)
        .order('completed_at', { ascending: false })
        .limit(1)

      if (updateError) {
        console.warn('⚠️ [onboarding-trigger] Erro ao atualizar onboarding_history:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído: ${tasksCreated} tarefas criadas`,
      tasks_created: tasksCreated,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ [onboarding-trigger] Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: (error as any)?.message || String(error)
    }, { status: 500 })
  }
}

/**
 * Renderiza mensagem com variáveis básicas
 */
async function renderMessageWithVariables(
  template: string,
  student: any,
  completedAt: string
): Promise<string> {
  let message = template

  // Variáveis básicas disponíveis para first_workout
  message = message.replace(/\[PrimeiroNome\]/g, student.name.split(' ')[0] || student.name)
  message = message.replace(/\[NomeCompleto\]/g, student.name)
  message = message.replace(/\[DataPrimeiroTreino\]/g, new Date(completedAt).toLocaleDateString('pt-BR'))
  message = message.replace(/\[SaudacaoTemporal\]/g, getTemporalGreeting())

  return message
}

function getTemporalGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}
