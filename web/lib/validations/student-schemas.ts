import { z } from 'zod'

/**
 * Schemas de validação Zod para o módulo de Alunos
 * Versão: 1.0
 * Data: 11/10/2025
 */

// Validação de telefone brasileiro (com ou sem formatação)
const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/

// Schema para criação de aluno (campos obrigatórios mínimos)
export const createStudentSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  email: z
    .string()
    .email('E-mail inválido')
    .toLowerCase()
    .max(255, 'E-mail deve ter no máximo 255 caracteres'),
  
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || phoneRegex.test(val),
      'Telefone inválido. Use o formato (11) 91234-5678'
    ),
  
  status: z
    .enum(['onboarding', 'active', 'paused', 'inactive'])
    .default('onboarding'),
  
  onboard_opt: z
    .enum(['enviar', 'nao_enviar'])
    .optional(),
})

// Schema para edição de aluno (todos os campos opcionais exceto ID)
export const updateStudentSchema = z.object({
  id: z.string().uuid('ID inválido'),
  
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
    .optional(),
  
  email: z
    .string()
    .email('E-mail inválido')
    .toLowerCase()
    .max(255, 'E-mail deve ter no máximo 255 caracteres')
    .optional(),
  
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || phoneRegex.test(val),
      'Telefone inválido. Use o formato (11) 91234-5678'
    ),
  
  status: z
    .enum(['onboarding', 'active', 'paused', 'inactive'])
    .optional(),
  
  birth_date: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Data de nascimento inválida. Use o formato YYYY-MM-DD'
    ),
  
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
})

// Schema para informações pessoais
export const personalInfoSchema = z.object({
  birth_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        const date = new Date(val)
        const now = new Date()
        const age = (now.getFullYear() - date.getFullYear())
        return age >= 0 && age <= 120
      },
      'Data de nascimento inválida'
    ),
  
  gender: z
    .enum(['masculino', 'feminino', 'outro'])
    .optional(),
  
  marital_status: z
    .enum(['solteiro', 'casado', 'divorciado', 'viuvo'])
    .optional(),
  
  nationality: z
    .string()
    .min(2, 'Nacionalidade deve ter pelo menos 2 caracteres')
    .max(50, 'Nacionalidade deve ter no máximo 50 caracteres')
    .optional(),
  
  birth_place: z
    .string()
    .min(2, 'Local de nascimento deve ter pelo menos 2 caracteres')
    .max(100, 'Local de nascimento deve ter no máximo 100 caracteres')
    .optional(),
})

// Schema para endereço
export const addressSchema = z.object({
  zip_code: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{5}-?\d{3}$/.test(val),
      'CEP inválido. Use o formato 12345-678'
    ),
  
  street: z
    .string()
    .min(3, 'Rua deve ter pelo menos 3 caracteres')
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
    .min(2, 'Cidade deve ter pelo menos 2 caracteres')
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .optional(),
  
  state: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres (ex: SP, RJ)')
    .toUpperCase()
    .optional(),
})

// Schema para responsável
export const responsibleSchema = z.object({
  professional_id: z.number().positive('ID do profissional inválido'),
  roles: z.array(z.enum(['principal', 'apoio', 'especifico'])).min(1, 'Selecione pelo menos um papel'),
})

// Type exports para TypeScript
export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type ResponsibleInput = z.infer<typeof responsibleSchema>

