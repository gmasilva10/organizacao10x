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
    .email('Email inválido')
    .toLowerCase()
    .max(100, 'Email deve ter no máximo 100 caracteres'),
  
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
  
  status: z.enum(['onboarding', 'active', 'paused', 'inactive'], {
    errorMap: () => ({ message: 'Status inválido' })
  }),
  
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
    }),
  
  gender: z
    .enum(['masculino', 'feminino', 'outro'], {
      errorMap: () => ({ message: 'Gênero inválido' })
    })
    .optional(),
  
  marital_status: z
    .enum(['solteiro', 'casado', 'divorciado', 'viuvo'], {
      errorMap: () => ({ message: 'Estado civil inválido' })
    })
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
    .enum(['nao_enviar', 'enviar', 'enviado'], {
      errorMap: () => ({ message: 'Opção de onboarding inválida' })
    })
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
  if (error && error.errors && Array.isArray(error.errors)) {
    error.errors.forEach((err) => {
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
    schema.parse({ [fieldName]: value })
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find((err) => err.path.includes(fieldName))
      return fieldError?.message || 'Erro de validação'
    }
    return 'Erro de validação'
  }
}

