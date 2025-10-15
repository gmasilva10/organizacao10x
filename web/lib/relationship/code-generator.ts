/**
 * Code Generator - Gerador de Código Sequencial para Templates
 * 
 * Gera códigos sequenciais de 4 dígitos por organização (0001, 0002, etc)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!

/**
 * Gera próximo código sequencial para uma organização
 */
export async function generateNextTemplateCode(orgId: string): Promise<string> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Buscar maior código existente para esta org
    const { data, error } = await supabase
      .from('relationship_templates_v2')
      .select('code')
      .eq('org_id', orgId)
      .order('code', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('Erro ao buscar último código:', error)
      return '0001' // Começar do 1 se houver erro
    }
    
    if (!data || data.length === 0) {
      return '0001' // Primeiro template da org
    }
    
    // Extrair número do último código e incrementar
    const lastCode = data[0].code
    const lastNumber = parseInt(lastCode, 10) || 0
    const nextNumber = lastNumber + 1
    
    // Formatar com 4 dígitos (0001, 0002, etc)
    return nextNumber.toString().padStart(4, '0')
    
  } catch (error) {
    console.error('Erro ao gerar código:', error)
    return '0001'
  }
}

/**
 * Valida formato de código (4 dígitos)
 */
export function validateTemplateCode(code: string): boolean {
  return /^\d{4}$/.test(code)
}

/**
 * Verifica se código já existe para uma org
 */
export async function codeExistsForOrg(code: string, orgId: string, excludeId?: string): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    let query = supabase
      .from('relationship_templates_v2')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', code)
    
    if (excludeId) {
      query = query.neq('id', excludeId)
    }
    
    const { data, error } = await query.limit(1)
    
    if (error) {
      console.error('Erro ao verificar código:', error)
      return false
    }
    
    return data && data.length > 0
    
  } catch (error) {
    console.error('Erro ao verificar código:', error)
    return false
  }
}
