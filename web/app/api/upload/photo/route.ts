import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveRequestContext(request)
    
    if (!ctx || !ctx.tenantId) {
      return NextResponse.json(
        { error: "unauthorized", message: "Tenant não resolvido no contexto da requisição." },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const studentId = formData.get('studentId') as string

    if (!file || !studentId) {
      return NextResponse.json(
        { error: "bad_request", message: "Arquivo e ID do aluno são obrigatórios." },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "invalid_file_type", message: "Apenas arquivos de imagem são permitidos." },
        { status: 400 }
      )
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "file_too_large", message: "Arquivo deve ter no máximo 10MB." },
        { status: 400 }
      )
    }

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    
    if (!url || !key) {
      return NextResponse.json(
        { error: "service_unavailable", message: "Variáveis de ambiente do Supabase ausentes." },
        { status: 503 }
      )
    }

    // Converter arquivo para buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Nome único para o arquivo
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${studentId}-${Date.now()}.${fileExtension}`
    
    // Upload para Supabase Storage usando a API do Supabase
    const { data, error } = await supabase.storage
      .from('student-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (error) {
      console.error('Supabase Storage Upload Error:', error)
      return NextResponse.json({ error: 'upload_failed', message: `Erro ao fazer upload da foto: ${error.message}` }, { status: 500 })
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('student-photos')
      .getPublicUrl(fileName)

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return NextResponse.json({ error: 'url_not_found', message: 'Não foi possível obter a URL pública da foto.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, photo_url: publicUrlData.publicUrl }, { status: 200 })

  } catch (error) {
    console.error("Erro na API de upload de foto:", error)
    return NextResponse.json(
      { error: "internal_error", message: "Erro interno do servidor." },
      { status: 500 }
    )
  }
}
