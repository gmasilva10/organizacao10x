import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@/utils/supabase/server'
import { withOccurrencesRBAC } from '@/server/withOccurrencesRBAC'
import { RELATIONSHIP_TEMPLATE_SEEDS } from '@/lib/relationship/template-seeds'

export async function POST(request: NextRequest) {
  return withOccurrencesRBAC(request, 'occurrences.write', async (request, { user, membership, tenant_id }) => {
    try {
      const supabase = await createClient()
      
      // Verificar se já existem templates para este tenant
      const { data: existingTemplates, error: checkError } = await supabase
        .from('relationship_templates_v2')
        .select('id')
        .eq('tenant_id', tenant_id)
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
      
      // Aplicar seeds
      const templatesToInsert = RELATIONSHIP_TEMPLATE_SEEDS.map(template => ({
        ...template,
        tenant_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const { data: insertedTemplates, error: insertError } = await supabase
        .from('relationship_templates_v2')
        .insert(templatesToInsert)
        .select('id, code, title')
      
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
        details: error.message 
      }, { status: 500 })
    }
  })
}
