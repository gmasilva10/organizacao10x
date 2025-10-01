import { NextResponse, NextRequest } from 'next/server'

export async function POST(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ ok: true })
}

export async function PATCH(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ ok: true })
}



