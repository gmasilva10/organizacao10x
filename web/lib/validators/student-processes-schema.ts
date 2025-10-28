import { z } from "zod"

// Schema para validação de processos de aluno
export const studentProcessSchema = z.object({
  studentId: z.string().uuid("ID do aluno inválido"),
  processType: z.enum([
    'matricular',
    'onboarding', 
    'anamnese',
    'diretriz',
    'treino',
    'ocorrencia',
    'mensagem',
    'email',
    'whatsapp',
    'inativar',
    'excluir'
  ], {
    errorMap: () => ({ message: "Tipo de processo inválido" })
  }),
  requiredFields: z.array(z.string()).optional(),
  status: z.enum(['onboarding', 'active', 'paused', 'inactive']).optional(),
  permissions: z.array(z.string()).optional()
})

// Schema para validação de anexos
export const studentAttachmentSchema = z.object({
  studentId: z.string().uuid("ID do aluno inválido"),
  attachmentType: z.enum([
    'onboarding',
    'anamnese', 
    'diretriz',
    'treino',
    'ocorrencia',
    'relacionamento',
    'arquivo'
  ], {
    errorMap: () => ({ message: "Tipo de anexo inválido" })
  }),
  fileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().optional(),
  required: z.boolean().optional()
})

// Validações específicas por tipo de processo
export const processValidations = {
  matricular: {
    requiredFields: ['name', 'email', 'phone'],
    allowedStatuses: ['onboarding'],
    message: "Para matricular um aluno, é necessário ter nome, email e telefone preenchidos"
  },
  onboarding: {
    requiredFields: ['name', 'email', 'phone'],
    allowedStatuses: ['onboarding', 'active'],
    message: "Para enviar onboarding, é necessário ter dados básicos preenchidos"
  },
  anamnese: {
    requiredFields: ['name', 'email', 'phone', 'birth_date'],
    allowedStatuses: ['onboarding', 'active', 'paused'],
    message: "Para gerar anamnese, é necessário ter dados pessoais completos incluindo data de nascimento"
  },
  diretriz: {
    requiredFields: ['name', 'email', 'phone'],
    allowedStatuses: ['active'],
    message: "Para gerar diretriz, o aluno deve estar ativo"
  },
  treino: {
    requiredFields: ['name', 'email', 'phone'],
    allowedStatuses: ['active'],
    message: "Para gerar treino, o aluno deve estar ativo"
  },
  ocorrencia: {
    requiredFields: ['name', 'email'],
    allowedStatuses: ['onboarding', 'active', 'paused', 'inactive'],
    message: "Para criar ocorrência, é necessário ter nome e email preenchidos"
  },
  mensagem: {
    requiredFields: ['name', 'phone'],
    allowedStatuses: ['onboarding', 'active', 'paused'],
    message: "Para enviar mensagem, é necessário ter nome e telefone preenchidos"
  },
  email: {
    requiredFields: ['name', 'email'],
    allowedStatuses: ['onboarding', 'active', 'paused'],
    message: "Para enviar email, é necessário ter nome e email preenchidos"
  },
  whatsapp: {
    requiredFields: ['name', 'phone'],
    allowedStatuses: ['onboarding', 'active', 'paused'],
    message: "Para usar WhatsApp, é necessário ter nome e telefone preenchidos"
  },
  inativar: {
    requiredFields: ['name'],
    allowedStatuses: ['onboarding', 'active', 'paused'],
    message: "Para inativar, é necessário ter o nome preenchido"
  },
  excluir: {
    requiredFields: ['name'],
    allowedStatuses: ['onboarding', 'active', 'paused', 'inactive'],
    message: "Para excluir, é necessário ter o nome preenchido"
  }
}

// Validações específicas por tipo de anexo
export const attachmentValidations = {
  onboarding: {
    fileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    required: false
  },
  anamnese: {
    fileTypes: ['pdf', 'doc', 'docx'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    required: true
  },
  diretriz: {
    fileTypes: ['pdf', 'doc', 'docx'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    required: false
  },
  treino: {
    fileTypes: ['pdf', 'doc', 'docx', 'xlsx', 'xls'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    required: false
  },
  ocorrencia: {
    fileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    required: false
  },
  relacionamento: {
    fileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'mp4', 'mp3'],
    maxFileSize: 20 * 1024 * 1024, // 20MB
    required: false
  },
  arquivo: {
    fileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'xlsx', 'xls', 'mp4', 'mp3'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    required: false
  }
}

// Função para validar se um processo pode ser executado
export function validateProcessExecution(
  processType: keyof typeof processValidations,
  studentData: any
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const validation = processValidations[processType]
  const errors: string[] = []
  const warnings: string[] = []

  // Verificar campos obrigatórios
  if (validation.requiredFields) {
    for (const field of validation.requiredFields) {
      if (!studentData[field] || studentData[field].trim() === '') {
        errors.push(`Campo obrigatório: ${getFieldLabel(field)}`)
      }
    }
  }

  // Verificar status permitido
  if (validation.allowedStatuses && studentData.status) {
    if (!validation.allowedStatuses.includes(studentData.status)) {
      errors.push(`Status '${getStatusLabel(studentData.status)}' não permite esta ação. Status permitidos: ${validation.allowedStatuses.map(s => getStatusLabel(s)).join(', ')}`)
    }
  }

  // Adicionar avisos específicos
  if (processType === 'excluir' && studentData.status === 'active') {
    warnings.push('Aluno está ativo. Considere inativar antes de excluir.')
  }

  if (processType === 'inativar' && studentData.status === 'inactive') {
    warnings.push('Aluno já está inativo.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Função para validar anexo
export function validateAttachment(
  attachmentType: keyof typeof attachmentValidations,
  file: File
): { isValid: boolean; errors: string[] } {
  const validation = attachmentValidations[attachmentType]
  const errors: string[] = []

  // Verificar tipo de arquivo
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (validation.fileTypes && fileExtension && !validation.fileTypes.includes(fileExtension)) {
    errors.push(`Tipo de arquivo '${fileExtension}' não permitido. Tipos aceitos: ${validation.fileTypes.join(', ')}`)
  }

  // Verificar tamanho do arquivo
  if (validation.maxFileSize && file.size > validation.maxFileSize) {
    const maxSizeMB = validation.maxFileSize / (1024 * 1024)
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
    errors.push(`Arquivo muito grande: ${fileSizeMB}MB. Tamanho máximo: ${maxSizeMB}MB`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Funções auxiliares
function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    name: 'Nome',
    email: 'Email',
    phone: 'Telefone',
    birth_date: 'Data de Nascimento',
    gender: 'Sexo',
    marital_status: 'Estado Civil',
    nationality: 'Nacionalidade',
    birth_place: 'Local de Nascimento'
  }
  return labels[field] || field
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    onboarding: 'Onboarding',
    active: 'Ativo',
    paused: 'Pausado',
    inactive: 'Inativo'
  }
  return labels[status] || status
}

// Função para formatar erros de validação
export function formatProcessErrors(errors: string[]): string {
  if (errors.length === 0) return ''
  if (errors.length === 1) return errors[0]
  return `Múltiplos erros encontrados:\n• ${errors.join('\n• ')}`
}

// Função para formatar avisos
export function formatProcessWarnings(warnings: string[]): string {
  if (warnings.length === 0) return ''
  if (warnings.length === 1) return warnings[0]
  return `Avisos:\n• ${warnings.join('\n• ')}`
}
