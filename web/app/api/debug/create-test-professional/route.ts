import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(request: NextRequest) {
  // Guard: somente disponível em dev ou quando explicitamente habilitado
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.ENABLE_DEBUG_ROUTES !== '1'
  ) {
    return NextResponse.json({ error: 'Debug endpoint disabled' }, { status: 403 })
  }
  try {
    const supabase = await createClientAdmin()
    
    console.log('🔧 [DEBUG] Criando profissional de teste...')
    
    // 1. Buscar o primeiro tenant disponível
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .limit(1)
    
    if (tenantsError || !tenants || tenants.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum tenant encontrado',
        details: 'É necessário ter pelo menos um tenant cadastrado'
      }, { status: 400 })
    }
    
    const tenant = tenants[0]
    
    // 2. Buscar o primeiro usuário disponível
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(1)
    
    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum usuário encontrado',
        details: 'É necessário ter pelo menos um usuário cadastrado'
      }, { status: 400 })
    }
    
    const user = users[0]
    
    // 3. Verificar se já existe um profissional para este usuário
    const { data: existingProfessional } = await supabase
      .from('professionals')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('org_id', tenant.id)
      .single()
    
    if (existingProfessional) {
      return NextResponse.json({
        success: true,
        message: 'Profissional já existe',
        data: {
          user_id: user.id,
          tenant_id: tenant.id,
          already_exists: true
        }
      })
    }
    
    // 4. Criar profissional de teste
    const { data: newProfessional, error: createError } = await supabase
      .from('professionals')
      .insert({
        user_id: user.id,
        tenant_id: tenant.id,
        full_name: 'Profissional de Teste',
        email: user.email,
        phone: '+5511999999999',
        role: 'trainer',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('user_id, full_name, tenant_id, role')
      .single()
    
    if (createError) {
      console.error('❌ Erro ao criar profissional:', createError)
      return NextResponse.json({ 
        error: 'Erro ao criar profissional',
        details: createError.message 
      }, { status: 500 })
    }
    
    // 5. Verificar se o usuário tem membership
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('user_id, tenant_id, role')
      .eq('user_id', user.id)
      .eq('org_id', tenant.id)
      .single()
    
    if (!existingMembership) {
      // Criar membership se não existir
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id: user.id,
          tenant_id: tenant.id,
          role: 'trainer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (membershipError) {
        console.error('❌ Erro ao criar membership:', membershipError)
        return NextResponse.json({ 
          error: 'Erro ao criar membership',
          details: membershipError.message 
        }, { status: 500 })
      }
    }
    
    console.log('✅ Profissional de teste criado com sucesso!')
    
    return NextResponse.json({
      success: true,
      message: 'Profissional de teste criado com sucesso',
      data: {
        professional: newProfessional,
        tenant: tenant,
        user: user,
        membership_created: !existingMembership
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

