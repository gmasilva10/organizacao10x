import { z } from 'zod'

/**
 * Schema de validação para dados de aluno
 * Usado em: StudentEditTabsV6, StudentCreateModal
 */

// Regex para validação de telefone brasileiro (com ou sem formatação)
const phoneRegex = /^(\d{10,11}|\(\d{2}\)\s?\d{4,5}-?\d{4})$/

export const studentIdentificationSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .refine((val) => val.trim().length >= 3, {
      message: 'Nome não pode conter apenas espaços'
    }),
  
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Digite um e-mail válido (ex: nome@exemplo.com)')
    .toLowerCase()
    .max(100, 'E-mail deve ter no máximo 100 caracteres'),
  
  phone: z
    .string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 caracteres')
    .refine((val) => {
      const digits = val.replace(/\D/g, '')
      return digits.length >= 10 && digits.length <= 11
    }, {
      message: 'Telefone inválido (use formato: (XX) XXXXX-XXXX)'
    }),
  
  status: z.enum(['onboarding', 'active', 'paused', 'inactive']),
  
  birth_date: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true
      // Validar formato YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(val)) return false
      
      // Validar data válida
      const date = new Date(val)
      return !isNaN(date.getTime())
    }, {
      message: 'Data de nascimento inválida (formato: AAAA-MM-DD)'
    })
    .refine((val) => {
      if (!val) return true
      const m = /^(\d{4})-\d{2}-\d{2}$/.exec(val)
      if (!m) return false
      const year = Number(m[1])
      const currentYear = new Date().getFullYear()
      return year >= 1900 && year <= currentYear
    }, {
      message: 'Ano da data de nascimento deve estar entre 1900 e o ano atual'
    }),
  
  gender: z
    .enum(['masculino', 'feminino', 'outro'])
    .optional(),
  
  marital_status: z
    .enum(['solteiro', 'casado', 'divorciado', 'viuvo'])
    .optional(),
  
  nationality: z
    .string()
    .max(50, 'Nacionalidade deve ter no máximo 50 caracteres')
    .optional(),
  
  birth_place: z
    .string()
    .max(100, 'Local de nascimento deve ter no máximo 100 caracteres')
    .optional(),
  
  onboard_opt: z
    .enum(['nao_enviar', 'enviar', 'enviado'])
    .optional(),
})

export const studentAddressSchema = z.object({
  street: z
    .string()
    .max(200, 'Rua deve ter no máximo 200 caracteres')
    .optional(),
  
  number: z
    .string()
    .max(10, 'Número deve ter no máximo 10 caracteres')
    .optional(),
  
  complement: z
    .string()
    .max(100, 'Complemento deve ter no máximo 100 caracteres')
    .optional(),
  
  neighborhood: z
    .string()
    .max(100, 'Bairro deve ter no máximo 100 caracteres')
    .optional(),
  
  city: z
    .string()
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .optional(),
  
  state: z
    .string()
    .max(2, 'Estado deve ter 2 caracteres (UF)')
    .optional(),
  
  zip_code: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true
      const digits = val.replace(/\D/g, '')
      return digits.length === 8
    }, {
      message: 'CEP inválido (use formato: XXXXX-XXX)'
    }),
})

// Schema completo para criação de aluno
export const studentCreateSchema = studentIdentificationSchema.extend({
  address: studentAddressSchema.optional(),
})

// Schema para atualização (campos opcionais)
export const studentUpdateSchema = studentIdentificationSchema.partial()

// Tipos TypeScript inferidos dos schemas
export type StudentIdentificationData = z.infer<typeof studentIdentificationSchema>
export type StudentAddressData = z.infer<typeof studentAddressSchema>
export type StudentCreateData = z.infer<typeof studentCreateSchema>
export type StudentUpdateData = z.infer<typeof studentUpdateSchema>

// Função helper para formatar erros Zod
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {}
  if (error && Array.isArray(error.issues)) {
    error.issues.forEach((err) => {
      const path = err.path.join('.')
      formatted[path] = err.message
    })
  }
  return formatted
}

// Função helper para validar campo único
export function validateField(
  schema: z.ZodSchema,
  fieldName: string,
  value: any
): string | null {
  try {
    // Validar apenas o campo específico, não o schema completo
    const fieldSchema = (schema as any).shape?.[fieldName]
    if (!fieldSchema) {
      console.warn(`Campo ${fieldName} não encontrado no schema`)
      return null
    }
    
    fieldSchema.parse(value)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Verificar se error.errors existe e tem elementos
      if (Array.isArray(error.issues) && error.issues.length > 0) {
        const firstError = error.issues[0]
        return firstError?.message || 'Erro de validação'
      }
    }
    return 'Erro de validação'
  }
}

// Função para validar dados completos com mensagens específicas
export function validateCompleteStudentData(data: any): {
  isValid: boolean
  errors: Record<string, string>
  fieldErrors: string[]
  generalErrors: string[]
} {
  const errors: Record<string, string> = {}
  const fieldErrors: string[] = []
  const generalErrors: string[] = []

  try {
    // Validar dados básicos
    studentIdentificationSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((issue) => {
        const fieldPath = issue.path.join('.')
        const message = issue.message
        
        errors[fieldPath] = message
        fieldErrors.push(`${fieldPath}: ${message}`)
      })
    }
  }

  // Validações adicionais específicas
  if (data.email && data.email.includes('@')) {
    // Verificar se email já existe (simulação - em produção seria uma chamada à API)
    const commonEmails = ['admin@test.com', 'test@example.com']
    if (commonEmails.includes(data.email.toLowerCase())) {
      errors.email = 'Este e-mail já está em uso'
      fieldErrors.push('email: Este e-mail já está em uso')
    }
  }

  // Validar telefone se fornecido
  if (data.phone) {
    const phoneDigits = data.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      errors.phone = 'Telefone deve ter pelo menos 10 dígitos'
      fieldErrors.push('phone: Telefone deve ter pelo menos 10 dígitos')
    }
  }

  // Validar data de nascimento se fornecida
  if (data.birth_date) {
    const birthDate = new Date(data.birth_date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    
    if (age < 0) {
      errors.birth_date = 'Data de nascimento não pode ser no futuro'
      fieldErrors.push('birth_date: Data de nascimento não pode ser no futuro')
    } else if (age > 120) {
      errors.birth_date = 'Data de nascimento inválida'
      fieldErrors.push('birth_date: Data de nascimento inválida')
    }
  }

  // Validar endereço se fornecido
  if (data.address) {
    try {
      studentAddressSchema.parse(data.address)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((issue) => {
          const fieldPath = `address.${issue.path.join('.')}`
          const message = issue.message
          
          errors[fieldPath] = message
          fieldErrors.push(`${fieldPath}: ${message}`)
        })
      }
    }
  }

  const isValid = Object.keys(errors).length === 0

  return {
    isValid,
    errors,
    fieldErrors,
    generalErrors
  }
}

// Função para gerar mensagens de erro amigáveis
export function generateUserFriendlyErrors(validationResult: ReturnType<typeof validateCompleteStudentData>): string[] {
  const messages: string[] = []
  
  if (validationResult.fieldErrors.length > 0) {
    messages.push('Por favor, corrija os seguintes campos:')
    validationResult.fieldErrors.forEach(error => {
      messages.push(`• ${error}`)
    })
  }
  
  if (validationResult.generalErrors.length > 0) {
    messages.push('')
    messages.push('Outros problemas encontrados:')
    validationResult.generalErrors.forEach(error => {
      messages.push(`• ${error}`)
    })
  }
  
  return messages
}

