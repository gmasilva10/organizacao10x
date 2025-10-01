import { setTimeout as delay } from "timers/promises"

export type ZapiContact = { firstName: string; phone: string; lastName?: string }

const base = process.env.ZAPI_BASE_URL!
const instance = process.env.ZAPI_INSTANCE_ID!
const token = process.env.ZAPI_INSTANCE_TOKEN!
const clientToken = process.env.ZAPI_CLIENT_TOKEN!
const timeoutMs = Number(process.env.ZAPI_TIMEOUT_MS ?? 8000)
const retries = Number(process.env.ZAPI_RETRIES ?? 0)

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "Client-Token": clientToken,
  } as const
}

async function fetchWithTimeout(url: string, init: RequestInit, timeout = timeoutMs): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

export async function zapiAddContacts(contacts: ZapiContact[]) {
  const url = `${base}/instances/${instance}/token/${token}/contacts/add`
  const body = JSON.stringify(contacts)
  let lastError: any = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { method: "POST", headers: getHeaders(), body })
      const data = await res.json().catch(() => ({}))
      return { ok: res.ok, status: res.status, data }
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await delay(200)
        continue
      }
      return { ok: false, status: 0, data: { error: "request_failed", message: String(lastError) } }
    }
  }
  return { ok: false, status: 0, data: { error: "unreachable" } }
}

export async function zapiCreateGroup(groupName: string, phones: string[], autoInvite = true) {
  const url = `${base}/instances/${instance}/token/${token}/create-group`
  const payload = { groupName, phones, autoInvite }
  const body = JSON.stringify(payload)
  
  if (process.env.DEBUG_LOGS === '1') {
    console.log('🔍 Z-API create-group payload:', JSON.stringify(payload, null, 2))
    console.log('🔍 Z-API create-group URL:', url)
  }
  
  try {
    const res = await fetchWithTimeout(url, { method: "POST", headers: getHeaders(), body })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  } catch (err) {
    return { ok: false, status: 0, data: { error: "request_failed" } }
  }
}

export async function zapiGroupAddParticipant(groupId: string, phones: string[], autoInvite = true) {
  const url = `${base}/instances/${instance}/token/${token}/add-participant`
  const body = JSON.stringify({ groupId, phones, autoInvite })
  try {
    const res = await fetchWithTimeout(url, { method: "POST", headers: getHeaders(), body })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: { error: "request_failed" } }
  }
}

export async function zapiGroupAddAdmin(groupId: string, phones: string[]) {
  const url = `${base}/instances/${instance}/token/${token}/add-admin`
  const body = JSON.stringify({ groupId, phones })
  try {
    const res = await fetchWithTimeout(url, { method: "POST", headers: getHeaders(), body })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: { error: "request_failed" } }
  }
}

export async function zapiGroupLeave(groupId: string) {
  const url = `${base}/instances/${instance}/token/${token}/leave-group`
  const body = JSON.stringify({ phone: groupId })
  try {
    const res = await fetchWithTimeout(url, { method: "POST", headers: getHeaders(), body })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: { error: "request_failed" } }
  }
}


