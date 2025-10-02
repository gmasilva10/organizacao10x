import { NextResponse } from "next/server"

// Alias para o endpoint existente em /api/settings/roles/restore-default
export async function POST(request: Request) {
  const url = new URL(request.url)
  const upstream = new URL("/api/settings/roles/restore-default", url.origin)
  const resp = await fetch(upstream, { method: "POST", headers: { cookie: request.headers.get("cookie") || "" } })
  const text = await resp.text()
  return new NextResponse(text, { status: resp.status, headers: { "Content-Type": resp.headers.get("Content-Type") || "application/json" } })
}



