export function sanitizeAddress(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  const zip = String(input?.zip ?? "").replace(/\D/g, "")
  if (zip) out.zip = zip.slice(0, 8)
  const fields = ['street','number','complement','district','city','state','country'] as const
  for (const f of fields) {
    const value = (input as Record<string, unknown>)[f]
    const v = String(value ?? "").trim()
    if (v) out[f] = v
  }
  if (out.state) out.state = out.state.toUpperCase().slice(0,2)
  if (!out.country) out.country = 'BR'
  return out
}


