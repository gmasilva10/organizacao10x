/**
 * Trigger: Sale Close → Immediate Templates
 * 
 * Dispara automaticamente a criação de tarefas de relacionamento
 * quando um aluno é matriculado (fechamento de venda).
 * Processa apenas templates com offset imediato (+0d ou temporal_offset_days = 0).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderMessageWithVariables } from '@/lib/relationship/variable-renderer'
import { VariableContextBuilder } from '@/lib/relationship/variable-context'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface SaleClosePayload {
  student_id: string
  org_id: string
  matriculated_at: string // Data da matrícula
}

export async function POST(request: NextRequest) {
  try {
    const payload: SaleClosePayload = await request.json()
    
    if (!payload.student_id || !payload.org_id || !payload.matriculated_at) {
      return NextResponse.json({ 
        error: 'Missing required fields: student_id, org_id, matriculated_at' 
      }, { status: 400 })
    }

    console.log('🔄 [sale-close-trigger] Processando fechamento de venda:', {
      student_id: payload.student_id,
      org_id: payload.org_id,
      matriculated_at: payload.matriculated_at
    })

    // Buscar templates ativos para sale_close
    const { data: templates, error: templatesError } = await supabase
      .from('relationship_templates_v2')
      .select('*')
      .eq('org_id', payload.org_id)
      .eq('active', true)
      .eq('anchor', 'sale_close')

    if (templatesError) {
      console.error('❌ [sale-close-trigger] Erro ao buscar templates:', templatesError)
      return NextResponse.json({ 
        error: 'Failed to fetch templates',
        details: templatesError.message 
      }, { status: 500 })
    }

    console.log(`📋 [sale-close-trigger] Templates encontrados: ${templates?.length || 0}`)
    
    if (!templates || templates.length === 0) {
      console.log('⚠️ [sale-close-trigger] Nenhum template ativo encontrado para sale_close')
      return NextResponse.json({ 
        success: true, 
        message: 'No active templates found for sale_close',
        tasks_created: 0,
        debug: { org_id: payload.org_id, templates_found: 0 }
      })
    }

    // Filtrar apenas templates com offset imediato
    const immediateTemplates = templates.filter(template => {
      // Verificar temporal_offset_days = 0
      if (template.temporal_offset_days === 0) return true
      // Verificar suggested_offset = '+0d'
      if (template.suggested_offset === '+0d') return true
      // Verificar suggested_offset que começa com '+0'
      if (template.suggested_offset?.match(/^\+0[dhms]?$/i)) return true
      return false
    })

    console.log(`⚡ [sale-close-trigger] Templates com offset imediato: ${immediateTemplates.length}`)
    
    if (immediateTemplates.length === 0) {
      console.log('⚠️ [sale-close-trigger] Nenhum template com offset imediato encontrado')
      console.log('📊 [sale-close-trigger] Templates encontrados (sem filtro):', templates.map(t => ({
        code: t.code,
        temporal_offset_days: t.temporal_offset_days,
        suggested_offset: t.suggested_offset
      })))
      return NextResponse.json({ 
        success: true, 
        message: 'No templates with immediate offset found',
        tasks_created: 0,
        debug: { 
          total_templates: templates.length,
          templates: templates.map(t => ({
            code: t.code,
            temporal_offset_days: t.temporal_offset_days,
            suggested_offset: t.suggested_offset
          }))
        }
      })
    }

    // Buscar dados completos do aluno
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email, phone, created_at, org_id, status, birth_date, first_workout_date, last_workout_date')
      .eq('id', payload.student_id)
      .eq('org_id', payload.org_id)
      .single()

    if (studentError || !student) {
      console.error('❌ [sale-close-trigger] Erro ao buscar aluno:', studentError)
      return NextResponse.json({ 
        error: 'Student not found' 
      }, { status: 404 })
    }

    let tasksCreated = 0
    const errors: string[] = []

    // Processar cada template imediato
    for (const template of immediateTemplates) {
      try {
        // Para offset imediato, scheduled_for = data da matrícula
        const scheduledDate = new Date(payload.matriculated_at)

        // Verificar se já existe tarefa para este aluno/template/data
        const todayStart = new Date(scheduledDate)
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(scheduledDate)
        todayEnd.setHours(23, 59, 59, 999)

        const { data: existingTask } = await supabase
          .from('relationship_tasks')
          .select('id')
          .eq('student_id', payload.student_id)
          .eq('template_code', template.code)
          .eq('anchor', 'sale_close')
          .gte('scheduled_for', todayStart.toISOString())
          .lte('scheduled_for', todayEnd.toISOString())
          .maybeSingle()

        if (existingTask) {
          console.log('⚠️ [sale-close-trigger] Tarefa já existe para template:', template.code)
          continue
        }

        // Construir contexto de variáveis
        const contextBuilder = new VariableContextBuilder()
        contextBuilder.withStudent({
          id: student.id,
          name: student.name,
          email: student.email || '',
          phone: student.phone || '',
          birth_date: student.birth_date,
          created_at: student.created_at,
          first_workout_date: student.first_workout_date,
          last_workout_date: student.last_workout_date,
          org_id: student.org_id,
          status: student.status as 'active' | 'inactive' | 'suspended' | undefined
        })
        
        // Adicionar dados específicos da âncora sale_close
        contextBuilder.withAnchor({
          anchor_date: payload.matriculated_at,
          anchor_type: 'sale_close',
          additional_data: {
            sale_date: payload.matriculated_at
          }
        })

        const context = contextBuilder.build()

        // Renderizar mensagem com variáveis
        const renderedMessage = await renderMessageWithVariables(
          template.message_v1,
          context,
          'sale_close'
        )

        // Criar tarefa de relacionamento
        console.log('📝 [sale-close-trigger] Criando tarefa para template:', {
          template_code: template.code,
          student_id: payload.student_id,
          scheduled_for: scheduledDate.toISOString()
        })
        
        const taskData = {
          org_id: payload.org_id,
          student_id: payload.student_id,
          template_code: template.code,
          anchor: 'sale_close',
          scheduled_for: scheduledDate.toISOString(),
          channel: template.channel_default || 'whatsapp',
          status: 'pending',
          payload: {
            message: renderedMessage,
            student_name: student.name,
            student_email: student.email,
            student_phone: student.phone,
            sale_date: payload.matriculated_at
          },
          variables_used: template.variables || [],
          created_by: 'system_sale_close_trigger'
        }
        
        console.log('📦 [sale-close-trigger] Dados da tarefa:', JSON.stringify(taskData, null, 2))
        
        const { data: insertedTask, error: insertError } = await supabase
          .from('relationship_tasks')
          .insert(taskData)
          .select()

        if (insertError) {
          console.error('❌ [sale-close-trigger] Erro ao criar tarefa:', insertError)
          console.error('❌ [sale-close-trigger] Detalhes do erro:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          })
          errors.push(`Erro ao criar tarefa para template ${template.code}: ${insertError.message}`)
        } else {
          tasksCreated++
          console.log('✅ [sale-close-trigger] Tarefa criada com sucesso:', {
            task_id: insertedTask?.[0]?.id,
            template_code: template.code,
            scheduled_for: scheduledDate.toISOString(),
            channel: template.channel_default
          })
        }
      } catch (error) {
        console.error('❌ [sale-close-trigger] Erro ao processar template:', error)
        errors.push(`Erro ao processar template ${template.code}: ${(error as any)?.message || String(error)}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído: ${tasksCreated} tarefas criadas`,
      tasks_created: tasksCreated,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ [sale-close-trigger] Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: (error as any)?.message || String(error)
    }, { status: 500 })
  }
}

