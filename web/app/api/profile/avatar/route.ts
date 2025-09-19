import { NextResponse } from "next/server"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(request: Request) {
  try {
    const { createClient } = await import("@/utils/supabase/server")
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) {
      return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 })
    }

    // Parse FormData (multipart/form-data)
    const formData = await request.formData()
    const file = formData.get("avatar") as File | null

    if (!file) {
      return NextResponse.json({ ok: false, code: "no_file" }, { status: 400 })
    }

    // Validações
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        ok: false, 
        code: "file_too_large",
        details: { max_size_mb: 5 }
      }, { status: 400 })
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        ok: false,
        code: "invalid_file_type", 
        details: { allowed_types: allowedTypes }
      }, { status: 400 })
    }

    // Gerar nome único
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}-${Date.now()}.${ext}`
    const filePath = `avatars/${fileName}`

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error("Avatar upload error:", uploadError)
      return NextResponse.json({
        ok: false,
        code: "upload_failed",
        details: { error: uploadError.message }
      }, { status: 500 })
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path)

    const avatarUrl = urlData.publicUrl

    // Atualizar perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (profileError) {
      console.error("Profile update error:", profileError)
      // Tentar limpar o arquivo se não conseguiu atualizar o perfil
      try {
        await supabase.storage.from('avatars').remove([uploadData.path])
      } catch {}
      
      return NextResponse.json({
        ok: false,
        code: "profile_update_failed"
      }, { status: 500 })
    }

    // Telemetria de sucesso (best-effort, não bloqueante)
    ;(async () => {
      try {
        const eurl = process.env.SUPABASE_URL
        const ekey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        if (eurl && ekey) {
          await fetch(`${eurl}/rest/v1/events`, {
            method: "POST",
            headers: { 
              apikey: ekey, 
              Authorization: `Bearer ${ekey}`, 
              "Content-Type": "application/json", 
              Prefer: "return=minimal" 
            },
            body: JSON.stringify({ 
              tenant_id: null, 
              user_id: user.id, 
              event_type: "profile.avatar_updated", 
              payload: { 
                file_size: file.size,
                file_type: file.type,
                ts: new Date().toISOString() 
              } 
            }),
            cache: "no-store",
          })
        }
      } catch {}
    })()

    return NextResponse.json({
      ok: true,
      avatar_url: avatarUrl,
      profile: {
        user_id: user.id,
        avatar_url: avatarUrl
      }
    })

  } catch (err) {
    console.error("/api/profile/avatar POST unexpected_error", err)
    return NextResponse.json({ ok: false, code: "unexpected_error" }, { status: 500 })
  }
}
