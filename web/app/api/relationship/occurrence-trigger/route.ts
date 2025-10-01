/**
 * GATE 10.6.2 - Gatilho de OcorrÃªncia
 * 
 * Funcionalidades:
 * - Disparo imediato ao salvar OcorrÃªncia com lembrete
 * - CriaÃ§Ã£o automÃ¡tica de tarefa occurrence_followup
 * - IntegraÃ§Ã£o com sistema de ocorrÃªncias existente
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface OccurrenceTriggerRequest {
  student_id: string
  occurrence_id: number
  reminder_at: string
  occurrence_type?: string
  occurrence_notes?: string
  tenant_id: string
}

interface OccurrenceTriggerResponse {
  success: boolean
  task_id?: string
  message: string
  error?: string
}

/**
 * Criar tarefa de follow-up de ocorrÃªncia
 */
async function createOccurrenceFollowupTask(
  studentId: string,
  occurrenceId: number,
  reminderAt: string,
  occurrenceType?: string,
  occurrenceNotes?: string
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    // Buscar dados do aluno
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email, phone, tenant_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return { 
        success: false, 
        error: `Student not found: ${studentError?.message}` 
      }
    }

    // Verificar se jÃ¡ existe tarefa para esta ocorrÃªncia
    const { data: existingTask } = await supabase
      .from('relationship_tasks')
      .select('id')
      .eq('student_id', studentId)
      .eq('occurrence_id', occurrenceId)
      .eq('anchor', 'occurrence_followup')
      .single()

    if (existingTask) {
      return { 
        success: true, 
        taskId: existingTask.id,
        error: 'Task already exists for this occurrence'
      }
    }

    // Renderizar mensagem personalizada
    const message = `Follow-up da ocorrÃªncia: ${occurrenceNotes || 'Sem descriÃ§Ã£o'}`
    const renderedMessage = message
      .replace(/\[Nome do Cliente\]/g, student.name)
      .replace(/\[Nome\]/g, student.name)
      .replace(/\[PrimeiroNome\]/g, student.name.split(' ')[0])
      .replace(/\[TipoOcorrencia\]/g, occurrenceType || 'OcorrÃªncia')
      .replace(/\[DescricaoOcorrencia\]/g, occurrenceNotes || 'Sem descriÃ§Ã£o')

    // Criar tarefa
    const { data: task, error: taskError } = await supabase
      .from('relationship_tasks')
      .insert({
        student_id: studentId,
        template_code: 'MSG_OCCURRENCE_FOLLOWUP',
        anchor: 'occurrence_followup',
        scheduled_for: reminderAt,
        channel: 'whatsapp',
        status: 'pending',
        payload: {
          message: renderedMessage,
          student_name: student.name,
          student_email: student.email,
          student_phone: student.phone,
          occurrence_type: occurrenceType,
          occurrence_notes: occurrenceNotes,
          occurrence_id: occurrenceId
        },
        variables_used: ['Nome', 'TipoOcorrencia', 'DescricaoOcorrencia'],
        created_by: 'system',
        occurrence_id: occurrenceId
      })
      .select('id')
      .single()

    if (taskError) {
      return { 
        success: false, 
        error: `Failed to create task: ${taskError.message}` 
      }
    }

    // Log da criaÃ§Ã£o
    await supabase
      .from('relationship_logs')
      .insert({
        student_id: studentId,
        task_id: task.id,
        action: 'created',
        channel: 'whatsapp',
        template_code: 'MSG_OCCURRENCE_FOLLOWUP',
        meta: {
          occurrence_id: occurrenceId,
          reminder_at: reminderAt,
          occurrence_type: occurrenceType,
          trigger_type: 'occurrence_saved'
        }
      })

    return { 
      success: true, 
      taskId: task.id 
    }

  } catch (error) {
    return { 
      success: false, 
      error: `Unexpected error: ${(error as any)?.message || String(error)}` 
    }
  }
}

/**
 * Atualizar tarefa existente de follow-up
 */
async function updateOccurrenceFollowupTask(
  taskId: string,
  reminderAt: string,
  occurrenceType?: string,
  occurrenceNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar dados da tarefa
    const { data: task, error: taskError } = await supabase
      .from('relationship_tasks')
      .select('student_id, payload')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return { 
        success: false, 
        error: `Task not found: ${taskError?.message}` 
      }
    }

    // Atualizar payload com novos dados
    const updatedPayload = {
      ...task.payload,
      occurrence_type: occurrenceType || task.payload.occurrence_type,
      occurrence_notes: occurrenceNotes || task.payload.occurrence_notes,
      message: `Follow-up da ocorrÃªncia: ${occurrenceNotes || 'Sem descriÃ§Ã£o'}`
        .replace(/\[Nome do Cliente\]/g, task.payload.student_name)
        .replace(/\[Nome\]/g, task.payload.student_name)
        .replace(/\[PrimeiroNome\]/g, task.payload.student_name.split(' ')[0])
        .replace(/\[TipoOcorrencia\]/g, occurrenceType || 'OcorrÃªncia')
        .replace(/\[DescricaoOcorrencia\]/g, occurrenceNotes || 'Sem descriÃ§Ã£o')
    }

    // Atualizar tarefa
    const { error: updateError } = await supabase
      .from('relationship_tasks')
      .update({
        scheduled_for: reminderAt,
        payload: updatedPayload,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (updateError) {
      return { 
        success: false, 
        error: `Failed to update task: ${updateError.message}` 
      }
    }

    // Log da atualizaÃ§Ã£o (agendamento)
    await supabase
      .from('relationship_logs')
      .insert({
        student_id: task.student_id,
        task_id: taskId,
        action: 'scheduled',
        channel: 'whatsapp',
        template_code: 'MSG_OCCURRENCE_FOLLOWUP',
        meta: {
          occurrence_id: task.payload.occurrence_id,
          reminder_at: reminderAt,
          occurrence_type: occurrenceType,
          trigger_type: 'occurrence_updated'
        }
      })

    return { success: true }

  } catch (error) {
    return { 
      success: false, 
      error: `Unexpected error: ${(error as any)?.message || String(error)}` 
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: OccurrenceTriggerRequest = await request.json()
    const { 
      student_id, 
      occurrence_id, 
      reminder_at, 
      occurrence_type, 
      occurrence_notes, 
      tenant_id 
    } = body

    // ValidaÃ§Ãµes
    if (!student_id || !occurrence_id || !reminder_at || !tenant_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: student_id, occurrence_id, reminder_at, tenant_id'
      }, { status: 400 })
    }

    // Verificar se jÃ¡ existe tarefa para esta ocorrÃªncia
    const { data: existingTask } = await supabase
      .from('relationship_tasks')
      .select('id')
      .eq('student_id', student_id)
      .eq('occurrence_id', occurrence_id)
      .eq('anchor', 'occurrence_followup')
      .single()

    let result: { success: boolean; taskId?: string; error?: string }

    if (existingTask) {
      // Atualizar tarefa existente
      result = await updateOccurrenceFollowupTask(
        existingTask.id,
        reminder_at,
        occurrence_type,
        occurrence_notes
      )
    } else {
      // Criar nova tarefa
      result = await createOccurrenceFollowupTask(
        student_id,
        occurrence_id,
        reminder_at,
        occurrence_type,
        occurrence_notes
      )
    }

    const response: OccurrenceTriggerResponse = {
      success: result.success,
      task_id: result.taskId,
      message: result.success 
        ? (existingTask ? 'Task updated successfully' : 'Task created successfully')
        : 'Failed to process occurrence trigger',
      error: result.error
    }

    return NextResponse.json(response, { 
      status: result.success ? 200 : 500 
    })

  } catch (error) {
    console.error('Occurrence trigger error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: (error as any)?.message || String(error)
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id')
  const occurrenceId = searchParams.get('occurrence_id')

  if (!studentId || !occurrenceId) {
    return NextResponse.json({
      error: 'student_id and occurrence_id are required'
    }, { status: 400 })
  }

  try {
    // Buscar tarefa existente
    const { data: task, error } = await supabase
      .from('relationship_tasks')
      .select('*')
      .eq('student_id', studentId)
      .eq('occurrence_id', occurrenceId)
      .eq('anchor', 'occurrence_followup')
      .single()

    if (error || !task) {
      return NextResponse.json({
        success: false,
        message: 'No follow-up task found for this occurrence'
      })
    }

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        scheduled_for: task.scheduled_for,
        status: task.status,
        payload: task.payload,
        created_at: task.created_at
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch task',
      message: (error as any)?.message || String(error)
    }, { status: 500 })
  }
}
