import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createClient()
    
    console.log('🔧 Iniciando correção de versão:', id)

    // Buscar a versão atual
    const { data: currentVersion, error: fetchError } = await supabase
      .from('guidelines_versions')
      .select(`
        *,
        guideline_rules (*)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !currentVersion) {
      console.error('❌ Erro ao buscar versão:', fetchError)
      return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 })
    }

    console.log('📋 Versão encontrada:', {
      id: currentVersion.id,
      status: currentVersion.status,
      version: currentVersion.version,
      title: currentVersion.title
    })

    if (currentVersion.status !== 'PUBLISHED') {
      console.log('⚠️ Versão não é PUBLICADA:', currentVersion.status)
      return NextResponse.json({ 
        error: "Apenas versões publicadas podem ser corrigidas" 
      }, { status: 400 })
    }

    // Buscar a próxima versão disponível
    const { data: versions, error: versionError } = await supabase
      .from('guidelines_versions')
      .select('version')
      .eq('tenant_id', currentVersion.tenant_id)
      .order('version', { ascending: false })
      .limit(1)

    if (versionError) {
      console.error('❌ Erro ao buscar versões:', versionError)
      return NextResponse.json({ error: "Erro ao buscar versões" }, { status: 500 })
    }

    const nextVersion = (versions?.[0]?.version || 0) + 1
    console.log('🔢 Próxima versão:', nextVersion)

    // Criar nova versão DRAFT
    const { data: newVersion, error: createError } = await supabase
      .from('guidelines_versions')
      .insert({
        tenant_id: currentVersion.tenant_id,
        title: currentVersion.title,
        version: nextVersion,
        status: 'DRAFT',
        is_default: false,
        published_at: null,
        published_by: null,
        created_by: currentVersion.created_by // Mesmo criador
        // TODO: Adicionar clone_from_version após migração
      })
      .select()
      .single()

    if (createError || !newVersion) {
      console.error('❌ Erro ao criar versão:', createError)
      return NextResponse.json({ error: "Erro ao criar versão" }, { status: 500 })
    }

    console.log('✅ Nova versão criada:', {
      id: newVersion.id,
      version: newVersion.version,
      status: newVersion.status
    })

    // Clonar as regras da versão original
    if (currentVersion.guideline_rules && currentVersion.guideline_rules.length > 0) {
    const rulesToClone = currentVersion.guideline_rules.map((rule: any) => ({
        version_id: newVersion.id,
        priority_clinical: rule.priority_clinical,
        condition: rule.condition,
        outputs: rule.outputs
        // TODO: Adicionar created_by após migração
      }))

      const { error: rulesError } = await supabase
        .from('guideline_rules')
        .insert(rulesToClone)

      if (rulesError) {
        console.error('Erro ao clonar regras:', rulesError)
        // Não falhar aqui, apenas logar o erro
      }
    }

    // Registrar auditoria
    const { error: auditError } = await supabase
      .from('guidelines_audit_log')
      .insert({
        tenant_id: currentVersion.tenant_id,
        version_id: newVersion.id,
        action: 'correct_version',
        details: {
          cloned_from: id,
          original_version: currentVersion.version,
          new_version: nextVersion,
          rules_cloned: currentVersion.guideline_rules?.length || 0
        },
        created_by: currentVersion.created_by
      })

    if (auditError) {
      console.error('Erro ao registrar auditoria:', auditError)
      // Não falhar aqui, apenas logar
    }

    return NextResponse.json({ 
      data: newVersion,
      success: true,
      message: `Versão ${nextVersion} criada como rascunho para correção`
    })

  } catch (error) {
    console.error('Erro na API de correção de versão:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
