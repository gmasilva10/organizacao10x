import { randomBytes } from 'crypto'

/**
 * Gera um token único para convites de anamnese
 * @returns Token hexadecimal de 64 caracteres
 */
export function generateAnamneseToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Valida se um token tem o formato correto
 * @param token Token a ser validado
 * @returns true se o token é válido
 */
export function isValidAnamneseToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token)
}

/**
 * Gera um hash para rastreabilidade de PDFs
 * @param data Dados para gerar o hash
 * @returns Hash SHA-256 em hexadecimal
 */
export function generatePdfHash(data: any): string {
  const crypto = require('crypto')
  const hash = crypto.createHash('sha256')
  hash.update(JSON.stringify(data))
  return hash.digest('hex').substring(0, 16) // 16 caracteres para ser mais legível
}
