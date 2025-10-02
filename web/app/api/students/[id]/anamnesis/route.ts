import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { resolveRequestContext } from "@/utils/context/request-context"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await resolveRequestContext(request)
    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: studentId } = await params
    const supabase = await createClient()

    // Verificar se o usuário tem permissão para acessar este aluno
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email, status, org_id')
      .eq('id', studentId)
      .eq('org_id', ctx.tenantId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    // Por enquanto, retornar dados mockados para não quebrar a interface
    // TODO: Implementar busca real quando as tabelas estiverem criadas
    const mockAnamnesis = [
      {
        id: "1",
        student_id: studentId,
        template_id: "template-1",
        template_name: "Anamnese Básica",
        status: "PENDING",
        created_at: new Date().toISOString(),
        completed_at: null,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        created_by: ctx.userId,
        created_by_name: "Sistema"
      }
    ]

    return NextResponse.json({
      anamnesis: mockAnamnesis,
      student: {
        id: student.id,
        name: student.name,
        email: student.email
      }
    })

  } catch (error) {
    console.error('Erro na API de anamnese:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
