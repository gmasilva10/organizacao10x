import { NextResponse } from 'next/server'

const BUCKET = 'onboarding-attachments'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    const { resolveRequestContext } = await import('@/utils/context/request-context')
    const ctx = await resolveRequestContext(request)

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!ctx?.org_id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { id: studentId, attachmentId } = await params
    const path = `${ctx.org_id}/${studentId}/${attachmentId}`
    const { error: delErr } = await supabase.storage.from(BUCKET).remove([path])
    if (delErr) return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('❌ [attachments.DELETE] unexpected', err)
    return NextResponse.json({ error: 'attachments_internal' }, { status: 500 })
  }
}


