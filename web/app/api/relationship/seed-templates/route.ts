import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@/utils/supabase/server'
import { withOccurrencesRBAC } from '@/server/withOccurrencesRBAC'
import { RELATIONSHIP_TEMPLATE_SEEDS } from '@/lib/relationship/template-seeds'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(request: NextRequest) {
  return withOccurrencesRBAC(request, 'occurrences.write', async (request, { user, membership, org_id }) => {
    try {
      const supabase = await createClient()
      
      // Verificar se já existem templates para este tenant
      const { data: existingTemplates, error: checkError } = await supabase
        .from('relationship_templates')
        .select('id')
        .eq('org_id', org_id)
        .limit(1)
      
      if (checkError) {
        console.error('Erro ao verificar templates existentes:', checkError)
        return NextResponse.json({ error: 'Erro ao verificar templates' }, { status: 500 })
      }
      
      if (existingTemplates && existingTemplates.length > 0) {
        return NextResponse.json({ 
          message: 'Templates já existem para este tenant',
          count: existingTemplates.length
        })
      }
      
      // Aplicar seeds no modelo MVP (title/type/content)
      const templatesToInsert = RELATIONSHIP_TEMPLATE_SEEDS.map(template => ({
        org_id,
        title: `${template.code} - ${template.touchpoint}`,
        type: 'whatsapp',
        content: JSON.stringify({ ...template, active: template.active ?? true }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const { data: insertedTemplates, error: insertError } = await supabase
        .from('relationship_templates')
        .insert(templatesToInsert)
        .select('id, title')
      
      if (insertError) {
        console.error('Erro ao inserir templates:', insertError)
        return NextResponse.json({ error: 'Erro ao inserir templates' }, { status: 500 })
      }
      
      return NextResponse.json({
        message: 'Templates aplicados com sucesso',
        count: insertedTemplates?.length || 0,
        templates: insertedTemplates
      })
      
    } catch (error) {
      console.error('Erro na API /relationship/seed-templates:', error)
      return NextResponse.json({ 
        error: 'Erro interno do servidor',
        details: (error as any)?.message || String(error) 
      }, { status: 500 })
    }
  })
}

