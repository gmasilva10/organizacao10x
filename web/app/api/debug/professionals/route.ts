import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientAdmin()
    
    console.log('🔍 [DEBUG] Verificando profissionais...')
    
    // 1. Verificar se há profissionais cadastrados
    const { data: professionals, error: professionalsError } = await supabase
      .from('professionals')
      .select('user_id, full_name, tenant_id, created_at')
      .limit(10)
    
    if (professionalsError) {
      console.error('❌ Erro ao buscar profissionais:', professionalsError)
      return NextResponse.json({ 
        error: 'Erro ao buscar profissionais',
        details: professionalsError.message 
      }, { status: 500 })
    }
    
    // 2. Verificar se há usuários na tabela auth.users
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(10)
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
      return NextResponse.json({ 
        error: 'Erro ao buscar usuários',
        details: usersError.message 
      }, { status: 500 })
    }
    
    // 3. Verificar se há memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('user_id, tenant_id, role, created_at')
      .limit(10)
    
    if (membershipsError) {
      console.error('❌ Erro ao buscar memberships:', membershipsError)
      return NextResponse.json({ 
        error: 'Erro ao buscar memberships',
        details: membershipsError.message 
      }, { status: 500 })
    }
    
    // 4. Verificar se há tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, created_at')
      .limit(5)
    
    if (tenantsError) {
      console.error('❌ Erro ao buscar tenants:', tenantsError)
      return NextResponse.json({ 
        error: 'Erro ao buscar tenants',
        details: tenantsError.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debug de profissionais concluído',
      data: {
        professionals: professionals?.length || 0,
        users: users?.length || 0,
        memberships: memberships?.length || 0,
        tenants: tenants?.length || 0
      },
      details: {
        professionals: professionals || [],
        users: users || [],
        memberships: memberships || [],
        tenants: tenants || []
      }
    })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
