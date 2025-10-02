/**
 * GATE 10.9 - Hotmart Integration - Connect
 * Salva credenciais e testa conexão OAuth2
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'
import { resolveRequestContext } from '@/server/context'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientAdmin()
    const ctx = await resolveRequestContext(request)
    if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    
    const body = await request.json()
    
    const { client_id, client_secret, basic_token } = body
    
    // Validar campos obrigatórios
    if (!client_id || !client_secret || !basic_token) {
      return NextResponse.json({
        error: 'Campos obrigatórios: client_id, client_secret, basic_token'
      }, { status: 400 })
    }
    
    // Obter org_id do contexto de autenticação
    const org_id = ctx.tenantId
    
    // Testar conexão OAuth2 com Hotmart
    const authString = Buffer.from(`${client_id}:${client_secret}`).toString('base64')
    
    const tokenResponse = await fetch('https://api-sec-vlc.hotmart.com/security/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: client_id,
        client_secret: client_secret
      })
    })
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      return NextResponse.json({
        error: 'Credenciais inválidas',
        details: errorData.error_description || 'Erro ao conectar com Hotmart'
      }, { status: 401 })
    }
    
    const tokenData = await tokenResponse.json()
    const access_token = tokenData.access_token
    const { expires_in } = tokenData
    
    // Calcular expiração do token
    const tokenExpiresAt = new Date()
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expires_in)
    
    // Verificar se já existe integração
    const { data: existing } = await supabase
      .from('hotmart_integrations')
      .select('id')
      .eq('org_id', org_id)
      .single()
    
    if (existing) {
      // ATUALIZAR integração existente
      const { error: updateError } = await supabase
        .from('hotmart_integrations')
        .update({
          client_id,
          client_secret, // TODO: Criptografar em produção
          basic_token,   // TODO: Criptografar em produção
          access_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          status: 'connected',
          last_sync: new Date().toISOString(),
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
      
      if (updateError) throw updateError
      
    } else {
      // CRIAR nova integração
      const { error: insertError } = await supabase
        .from('hotmart_integrations')
        .insert({
          org_id,
          client_id,
          client_secret, // TODO: Criptografar em produção
          basic_token,   // TODO: Criptografar em produção
          access_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          status: 'connected',
          last_sync: new Date().toISOString()
        })
      
      if (insertError) throw insertError
    }
    
    return NextResponse.json({
      success: true,
      message: 'Hotmart conectado com sucesso!',
      status: 'connected',
      token_expires_at: tokenExpiresAt.toISOString()
    })
    
  } catch (error: any) {
    console.error('[HOTMART CONNECT] Error:', error)
    return NextResponse.json({
      error: 'Erro ao conectar Hotmart',
      details: error.message
    }, { status: 500 })
  }
}
