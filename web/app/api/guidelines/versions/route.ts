import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const createVersionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveRequestContext(request)
    if (!ctx || !ctx.userId || !ctx.org_id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabase = await createClient()
    
    const { data: versions, error } = await supabase
      .from('guidelines_versions')
      .select(`
        *,
        guideline_rules (
          id,
          priority_clinical,
          condition,
          outputs,
          created_at
        )
      `)
      .eq('org_id', ctx.org_id)
      .order('version', { ascending: false })

    if (error) {
      console.error('Erro ao buscar versões:', error)
      return NextResponse.json({ error: "Erro ao buscar versões" }, { status: 500 })
    }

    return NextResponse.json({ 
      data: versions,
      success: true 
    })

  } catch (error) {
    console.error('Erro na API de versões:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveRequestContext(request)
    if (!ctx || !ctx.userId || !ctx.org_id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createVersionSchema.parse(body)

    const supabase = await createClient()

    // Buscar próxima versão
    const { data: lastVersion } = await supabase
      .from('guidelines_versions')
      .select('version')
      .eq('org_id', ctx.org_id)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = (lastVersion?.version || 0) + 1

    // Criar nova versão DRAFT
    const { data: version, error } = await supabase
      .from('guidelines_versions')
      .insert({
        org_id: ctx.org_id,
        version: nextVersion,
        status: 'DRAFT',
        is_default: false,
        title: 'Diretrizes Denis Foschini',
        created_by: ctx.userId
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar versão:', error)
      return NextResponse.json({ error: "Erro ao criar versão" }, { status: 500 })
    }

    return NextResponse.json({ 
      data: version,
      success: true 
    })

  } catch (error) {
    console.error('Erro na API de versões:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

