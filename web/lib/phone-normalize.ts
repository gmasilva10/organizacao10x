export function normalizeToE164DigitsBR(input: string, dddDefault?: string): { ok: boolean; value?: string; reason?: string } {
  const ddd = (dddDefault ?? process.env.ORG_DEFAULT_DDD ?? "11").toString()
  if (!input) return { ok: false, reason: "empty" }
  const digits = String(input).replace(/\D/g, "")
  if (!digits) return { ok: false, reason: "no_digits" }

  // Já em formato BR com DDI 55 e comprimento típico >= 12
  if (digits.startsWith("55") && digits.length >= 12 && digits.length <= 14) {
    return { ok: true, value: digits }
  }

  // 11 dígitos (DDD + número celular/fixo)
  if (digits.length === 11) {
    return { ok: true, value: `55${digits}` }
  }

  // 10 dígitos (sem nono dígito) → prefixar DDD default
  if (digits.length === 10) {
    return { ok: true, value: `55${ddd}${digits}` }
  }

  return { ok: false, reason: "invalid_length" }
}


