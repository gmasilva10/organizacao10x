import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

const WRITERS = new Set(['admin', 'manager'])

// Função para validar CPF
function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validação dos dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false
  
  return true
}

// Função para validar WhatsApp
function validateWhatsApp(whatsapp: string): boolean {
  const cleanWhatsApp = whatsapp.replace(/\D/g, '')
  // Aceita números brasileiros com ou sem código do país (55)
  // Formato: (XX) XXXXX-XXXX (11 dígitos) ou 55XXXXXXXXXXX (13 dígitos)
  return (cleanWhatsApp.length === 11 && cleanWhatsApp.startsWith('1')) || 
         (cleanWhatsApp.length === 13 && cleanWhatsApp.startsWith('55'))
}

// Função para validar email
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function GET(request: NextRequest) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)

  try {
    // Extrair parâmetros de query
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const q = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = (page - 1) * limit

    // Construir query base
    let query = supabase
      .from('professionals')
      .select(`
        id,
        profile_id,
        full_name,
        email,
        whatsapp_work,
        is_active,
        professional_profiles!inner(name)
      `)
      .eq('org_id', ctx.org_id)

    // Filtro por status (active/inactive)
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Filtro por busca (nome, email, telefone)
    if (q && q.trim()) {
      const searchTerm = q.trim()
      // Normalizar telefone (remover caracteres não numéricos)
      const phoneDigits = searchTerm.replace(/\D/g, '')
      
      query = query.or(`
        full_name.ilike.%${searchTerm}%,
        email.ilike.%${searchTerm}%,
        whatsapp_work.ilike.%${phoneDigits}%,
        whatsapp_personal.ilike.%${phoneDigits}%
      `)
    }

    // Ordenação e paginação
    query = query
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data: professionals, error, count } = await query

    if (error) {
      console.error('Erro ao buscar profissionais:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      professionals: professionals || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!WRITERS.has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const b = (body || {}) as Partial<{
    profile_id: number
    full_name: string
    cpf: string
    sex: string
    birth_date: string
    whatsapp_personal?: string
    whatsapp_work: string
    email: string
    notes?: string
    is_active: boolean
  }>

  // Validações
  const full_name = String((b.full_name ?? "").toString()).trim()
  if (full_name.length < 2 || full_name.length > 200) {
    return NextResponse.json({ error: "invalid_full_name" }, { status: 400 })
  }

  const cpf = String((b.cpf ?? "").toString()).trim()
  if (!validateCPF(cpf)) {
    return NextResponse.json({ error: "invalid_cpf" }, { status: 400 })
  }

  const sex = String((b.sex ?? "").toString()).trim()
  if (!['M', 'F', 'Outro'].includes(sex)) {
    return NextResponse.json({ error: "invalid_sex" }, { status: 400 })
  }

  const birth_date = String((b.birth_date ?? "").toString()).trim()
  if (!birth_date || isNaN(Date.parse(birth_date))) {
    return NextResponse.json({ error: "invalid_birth_date" }, { status: 400 })
  }

  const whatsapp_work = String((b.whatsapp_work ?? "").toString()).trim()
  if (!validateWhatsApp(whatsapp_work)) {
    return NextResponse.json({ error: "invalid_whatsapp_work" }, { status: 400 })
  }

  const whatsapp_personal = b.whatsapp_personal ? String(b.whatsapp_personal).trim() : null
  if (whatsapp_personal && !validateWhatsApp(whatsapp_personal)) {
    return NextResponse.json({ error: "invalid_whatsapp_personal" }, { status: 400 })
  }

  const email = String((b.email ?? "").toString()).trim()
  if (!validateEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 })
  }

  const profile_id = Number(b.profile_id)
  if (!Number.isInteger(profile_id) || profile_id <= 0) {
    return NextResponse.json({ error: "invalid_profile_id" }, { status: 400 })
  }

  const is_active = b.is_active !== undefined ? Boolean(b.is_active) : true

  const supabase = createClient(url, key)

  try {
    // Verificar se perfil existe no tenant
    const { data: profile, error: profileError } = await supabase
      .from('professional_profiles')
      .select('id')
      .eq('id', profile_id)
      .eq('org_id', ctx.org_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "profile_not_found" }, { status: 404 })
    }

    // Verificar se CPF já existe no tenant
    const { data: existingCPF, error: cpfError } = await supabase
      .from('professionals')
      .select('id')
      .eq('org_id', ctx.org_id)
      .eq('cpf', cpf)
      .single()

    if (cpfError && cpfError.code !== 'PGRST116') {
      console.error('Erro ao verificar CPF:', cpfError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    if (existingCPF) {
      return NextResponse.json({ error: "cpf_already_exists" }, { status: 409 })
    }

    // Verificar se email já existe no tenant
    const { data: existingEmail, error: emailError } = await supabase
      .from('professionals')
      .select('id')
      .eq('org_id', ctx.org_id)
      .eq('email', email)
      .single()

    if (emailError && emailError.code !== 'PGRST116') {
      console.error('Erro ao verificar email:', emailError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    if (existingEmail) {
      return NextResponse.json({ error: "email_already_exists" }, { status: 409 })
    }

    // Verificar se email já existe como usuário
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('Erro ao verificar usuário:', userError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    let user_id = null
    let tempPassword = null

    if (existingUser) {
      // Verificar se usuário já está vinculado a outro profissional
      const { data: linkedProfessional, error: linkError } = await supabase
        .from('professionals')
        .select('id, full_name')
        .eq('user_id', existingUser.id)
        .single()

      if (linkError && linkError.code !== 'PGRST116') {
        console.error('Erro ao verificar vínculo:', linkError)
        return NextResponse.json({ error: "database_error" }, { status: 500 })
      }

      if (linkedProfessional) {
        return NextResponse.json({ 
          error: "email_already_linked", 
          message: `E-mail já vinculado ao profissional: ${linkedProfessional.full_name}` 
        }, { status: 409 })
      }

      user_id = existingUser.id
    } else {
      // Gerar senha temporária
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      tempPassword = `Temp${randomDigits}!`

      // Criar usuário
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true
      })

      if (createUserError) {
        console.error('Erro ao criar usuário:', createUserError)
        return NextResponse.json({ error: "user_creation_failed" }, { status: 500 })
      }

      user_id = newUser.user?.id

      // Criar membership com role trainer
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id,
          org_id: ctx.org_id,
          role: 'trainer',
          status: 'active'
        })

      if (membershipError) {
        console.error('Erro ao criar membership:', membershipError)
        return NextResponse.json({ error: "membership_creation_failed" }, { status: 500 })
      }
    }

    // Criar profissional
    const { data: professional, error } = await supabase
      .from('professionals')
      .insert({
        org_id: ctx.org_id,
        profile_id,
        user_id,
        full_name,
        cpf,
        sex,
        birth_date,
        whatsapp_personal,
        whatsapp_work,
        email,
        notes: b.notes || null,
        is_active
      })
      .select(`
        *,
        professional_profiles!inner(name)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar profissional:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profissional criado com sucesso',
      professional,
      tempPassword: tempPassword ? {
        password: tempPassword,
        message: 'Usuário criado com senha temporária'
      } : null
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

