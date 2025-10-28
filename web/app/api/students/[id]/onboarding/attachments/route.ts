import { NextResponse } from 'next/server'

const BUCKET = 'onboarding-attachments'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    const { resolveRequestContext } = await import('@/utils/context/request-context')
    const ctx = await resolveRequestContext(request)

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!ctx?.org_id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { id: studentId } = await params
    const prefix = `${ctx.org_id}/${studentId}`

    // List objects under org/student folder
    const { data: objects, error: listErr } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })
    
    if (listErr) {
      console.error('❌ [attachments.GET] list failed:', listErr)
      return NextResponse.json({ error: 'list_failed' }, { status: 500 })
    }

    console.log('🔍 [attachments.GET] objects found:', objects?.length || 0, 'for prefix:', prefix)

    // Create signed URLs for download
    const items = await Promise.all((objects || []).map(async (obj) => {
      const path = `${prefix}/${obj.name}`
      const { data: signed, error: signedErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 30) // 30min
      
      if (signedErr) {
        console.error('❌ [attachments.GET] signed URL failed for:', path, signedErr)
      }

      return {
        id: path,
        file_name: obj.name,
        mime_type: obj.metadata?.mimetype || 'application/octet-stream',
        file_size: obj.metadata?.size ?? 0,
        description: null,
        created_at: obj.created_at,
        url: signed?.signedUrl || null,
        error: signedErr ? 'Failed to generate URL' : null
      }
    }))

    console.log('🔍 [attachments.GET] returning items:', items.length)
    return NextResponse.json(items)
  } catch (err) {
    console.error('❌ [attachments.GET] unexpected', err)
    return NextResponse.json({ error: 'attachments_internal' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json().catch(() => ({})) as { filename?: string; contentType?: string }
    if (!body.filename) return NextResponse.json({ error: 'invalid_filename' }, { status: 400 })

    const { createClient, createClientAdmin } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    const admin = await createClientAdmin()
    const { resolveRequestContext } = await import('@/utils/context/request-context')
    const ctx = await resolveRequestContext(request)

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!ctx?.org_id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const { id: studentId } = await params

    const objectPath = `${ctx.org_id}/${studentId}/${Date.now()}_${body.filename}`

    // Generate signed upload URL (requires service role)
    const { data: signed, error: uploadErr } = await (admin as any).storage
      .from(BUCKET)
      .createSignedUploadUrl(objectPath)

    if (uploadErr) {
      console.error('❌ [attachments.POST] createSignedUploadUrl failed', uploadErr)
      return NextResponse.json({ error: 'upload_url_failed' }, { status: 500 })
    }

    return NextResponse.json({ objectPath, uploadUrl: signed?.signedUrl })
  } catch (err) {
    console.error('❌ [attachments.POST] unexpected', err)
    return NextResponse.json({ error: 'attachments_internal' }, { status: 500 })
  }
}


