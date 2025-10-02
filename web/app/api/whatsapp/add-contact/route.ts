import { NextRequest, NextResponse } from "next/server"
import { zapiAddContacts } from "@/src/server/zapi"
import { normalizeToE164DigitsBR } from "@/lib/phone-normalize"

const WA_ENABLED = process.env.WA_ADD_CONTACT_ENABLED === "true"

// Rate limit simples em memória (por usuário): 1 req/seg
const lastHitByUser = new Map<string, number>()

function userKey(req: NextRequest) {
  return req.headers.get("x-forwarded-for") || "local"
}

export async function POST(req: NextRequest) {
  if (!WA_ENABLED) {
    return NextResponse.json({ success: false, error: "feature_disabled" }, { status: 403 })
  }

  const now = Date.now()
  const key = userKey(req)
  const last = lastHitByUser.get(key) || 0
  if (now - last < 1000) {
    return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429 })
  }
  lastHitByUser.set(key, now)

  try {
    const body = await req.json().catch(() => ({} as any))

    let firstName = ""
    let lastName = ""
    let phoneInput = ""

    if (body?.studentId) {
      return NextResponse.json({ success: false, error: "student_lookup_not_implemented" }, { status: 400 })
    } else if (body?.firstName && body?.phone) {
      firstName = String(body.firstName || "").trim()
      lastName = String(body.lastName || "").trim()
      phoneInput = String(body.phone || "")
    } else {
      return NextResponse.json({ success: false, error: "invalid_payload" }, { status: 400 })
    }

    const normalized = normalizeToE164DigitsBR(phoneInput)
    if (!normalized.ok || !normalized.value) {
      return NextResponse.json({ success: false, error: "invalid_phone" }, { status: 400 })
    }

    const { ok, status, data } = await zapiAddContacts([{ firstName, lastName, phone: normalized.value }])

    const success = ok && (data?.success === true || !data?.errors?.length)
    const errorsCount = Array.isArray(data?.errors) ? data.errors.length : 0

    logAction("whatsapp.add_contact", {
      payload: { firstName, lastName, phone: normalized.value },
      success,
      httpStatus: status,
      errorsCount,
    })

    if (success) {
      return NextResponse.json({ success: true }, { status: 200 })
    }
    const reason = data?.errors?.[0]?.message || data?.message || data?.error || "api_error"
    return NextResponse.json({ success: false, error: reason }, { status: status || 500 })
  } catch (err: any) {
    logAction("whatsapp.add_contact", {
      payload: {},
      success: false,
      httpStatus: 0,
      errorsCount: 1,
    })
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 })
  }
}

function logAction(event: string, data: Record<string, any>) {
  try {
    console.info(`[LOG] ${event}`, JSON.stringify(data))
  } catch {}
}



