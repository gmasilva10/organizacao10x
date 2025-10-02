import { NextRequest, NextResponse } from "next/server"
import { normalizeToE164DigitsBR } from "@/lib/phone-normalize"
import { zapiCreateGroup, zapiGroupAddAdmin, zapiGroupAddParticipant, zapiGroupLeave } from "@/src/server/zapi"

const ENABLED = process.env.WA_CREATE_GROUP_ENABLED === 'true'
const ORG_WA_NUMBER = process.env.ORG_WA_NUMBER || ''
const GROUP_GUARD_MS = Number(process.env.ZAPI_GROUP_GUARD_MS ?? 8000)

// Rate limit simples 1 req / 15s por usuário + anti duplo-clique por hash
const lastHit = new Map<string, number>()
const lastHash = new Map<string, number>()

function userKey(req: NextRequest) {
  return req.headers.get('x-forwarded-for') || 'local'
}

function makeHash(input: string) {
  let h = 0
  for (let i = 0; i < input.length; i++) h = Math.imul(31, h) + input.charCodeAt(i) | 0
  return String(h)
}

function logAction(event: string, data: Record<string, any>) {
  try { console.info(`[LOG] ${event}`, JSON.stringify(data)) } catch {}
}

export async function POST(req: NextRequest) {
  if (!ENABLED) return NextResponse.json({ success: false, message: 'feature_disabled' }, { status: 403 })

  const key = userKey(req)
  const now = Date.now()
  const last = lastHit.get(key) || 0
  if (now - last < 15000) return NextResponse.json({ success: false, message: 'rate_limited' }, { status: 429 })
  lastHit.set(key, now)

  const body = await req.json().catch(() => ({}))
  const { studentId, trainers = [], admins = [], groupName, autoInvite = true, consentGiven, studentPhone } = body || {}
  const correlationId = `${now}-${Math.random().toString(36).slice(2, 8)}`

  if (!groupName || !studentId) return NextResponse.json({ success: false, message: 'invalid_payload' }, { status: 400 })

  // Normalização e sanitização
  const normalizedTrainers = trainers
    .map((p: string) => normalizeToE164DigitsBR(p))
    .filter((r: any) => r.ok && r.value)
    .map((r: any) => r.value as string)

  // Include student phone to ensure at least 2 participants for group creation
  const normalizedStudentPhone = studentPhone ? normalizeToE164DigitsBR(studentPhone) : null
  const allParticipants = [...normalizedTrainers]
  if (normalizedStudentPhone?.ok && normalizedStudentPhone.value) {
    allParticipants.push(normalizedStudentPhone.value)
  }
  const participants = Array.from(new Set(allParticipants))
  if (participants.length < 2) return NextResponse.json({ success: false, message: 'need_at_least_2_participants' }, { status: 400 })
  
  console.log('🔍 Participants for group creation:', participants)
  console.log('🔍 ORG_WA_NUMBER:', ORG_WA_NUMBER)

  const requestHash = makeHash(`${groupName}|${participants.join(',')}`)
  const lastReqAt = lastHash.get(requestHash) || 0
  if (now - lastReqAt < GROUP_GUARD_MS) {
    return NextResponse.json({ success: false, message: 'duplicate_request' }, { status: 429 })
  }
  lastHash.set(requestHash, now)

  // Step 0: Add all participants as contacts first (Z-API requirement)
  const { zapiAddContacts } = await import('@/src/server/zapi')
  const contactsToAdd = participants.map(phone => ({
    firstName: 'Participante',
    lastName: 'Grupo',
    phone: phone
  }))
  
  console.log('🔍 Adding contacts before group creation:', contactsToAdd)
  const addContactsRes = await zapiAddContacts(contactsToAdd)
  console.log('🔍 Add contacts result:', JSON.stringify(addContactsRes, null, 2))
  
  if (!addContactsRes.ok) {
    console.error('❌ Failed to add contacts:', addContactsRes)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add participants as contacts',
      details: addContactsRes
    }, { status: 500 })
  }
  
  // Wait longer for contacts to be processed by Z-API
  console.log('⏳ Waiting 15 seconds for contacts to be processed...')
  await new Promise(resolve => setTimeout(resolve, 15000))

  // Step 1: Create group with autoInvite
  console.log('🔍 Attempting group creation with autoInvite...')
  const createRes = await zapiCreateGroup(groupName, participants, true)
  
  // Debug: log the raw response to understand the structure
  console.log('🔍 Z-API create-group raw response:', JSON.stringify(createRes, null, 2))
  
  const groupId = createRes?.data?.groupId || createRes?.data?.phone || createRes?.data?.id || ''
  const invitationLink = createRes?.data?.invitationLink || createRes?.data?.inviteLink || ''

  logAction('whatsapp.create_group', { correlationId, groupName, phonesCount: participants.length, consentGiven: !!consentGiven, success: createRes.ok, httpStatus: createRes.status, groupId, invitationLink })
  if (!createRes.ok || !groupId) {
    return NextResponse.json({ success: false, message: createRes?.data?.message || 'create_failed' }, { status: createRes.status || 500 })
  }

  // Step 2: Add missing participants (if any were not included initially)
  const adminSet = new Set(admins
    .map((p: string) => normalizeToE164DigitsBR(p))
    .filter((r: any) => r.ok && r.value)
    .map((r: any) => r.value as string))

  const pending: string[] = []
  for (const phone of participants) {
    const addRes = await zapiGroupAddParticipant(groupId, [phone], true)
    if (!addRes.ok) pending.push(phone)
    logAction('whatsapp.group_add_participant', { correlationId, groupId, phone, success: addRes.ok, httpStatus: addRes.status })
  }

  // Step 3: Promote admins
  let adminsPromoted = 0
  for (const phone of adminSet) {
    const resAdmin = await zapiGroupAddAdmin(groupId, [phone as any as string])
    if (resAdmin.ok) adminsPromoted++
    logAction('whatsapp.group_add_admin', { correlationId, groupId, phone, success: resAdmin.ok, httpStatus: resAdmin.status })
  }

  // Step 4: Leave group only if there is at least one promoted admin
  let orgLeft = false
  if (adminsPromoted >= 1) {
    const leaveRes = await zapiGroupLeave(groupId)
    orgLeft = !!leaveRes.ok
    logAction('whatsapp.group_leave', { correlationId, groupId, success: leaveRes.ok, httpStatus: leaveRes.status, reasonIfFalse: leaveRes.ok ? undefined : leaveRes.data?.message })
  } else {
    logAction('whatsapp.group_leave', { correlationId, groupId, success: false, httpStatus: 0, reasonIfFalse: 'no_admin_to_leave' })
  }

  const partial = pending.length > 0 || adminsPromoted < adminSet.size
  return NextResponse.json({ success: true, groupId, invitationLink, orgLeft, partial, pending }, { status: 200 })
}



