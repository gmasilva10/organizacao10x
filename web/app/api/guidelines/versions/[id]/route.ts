import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createClient()

    // Verificar se a versão existe e é DRAFT
    const { data: version, error: fetchError } = await supabase
      .from('guidelines_versions')
      .select('status, is_default, title')
      .eq('id', id)
      .single()

    if (fetchError || !version) {
      return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 })
    }

    if (version.status !== 'DRAFT') {
      return NextResponse.json({ 
        error: "Apenas versões em rascunho podem ser excluídas" 
      }, { status: 400 })
    }

    if (version.is_default) {
      return NextResponse.json({ 
        error: "Não é possível excluir a versão padrão" 
      }, { status: 400 })
    }

    // Excluir as regras primeiro
    const { error: rulesError } = await supabase
      .from('guideline_rules')
      .delete()
      .eq('version_id', id)

    if (rulesError) {
      console.error('Erro ao excluir regras:', rulesError)
      // Continuar mesmo com erro nas regras
    }

    // Excluir a versão
    const { error: deleteError } = await supabase
      .from('guidelines_versions')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao excluir versão:', deleteError)
      return NextResponse.json({ error: "Erro ao excluir versão" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Versão "${version.title}" excluída com sucesso`
    })

  } catch (error) {
    console.error('Erro na API de DELETE de versão:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}