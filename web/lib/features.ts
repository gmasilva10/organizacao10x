// Feature flags para funcionalidades em desenvolvimento
export const FEATURES = {
  // Relacionamento/CRM
  RELATIONSHIP_STUBS: process.env.NEXT_PUBLIC_FEATURE_RELATIONSHIP_STUBS === 'true',
  
  // WhatsApp
  WHATSAPP_INTEGRATION: process.env.NEXT_PUBLIC_FEATURE_WHATSAPP === 'true',
  
  // Email
  EMAIL_INTEGRATION: process.env.NEXT_PUBLIC_FEATURE_EMAIL === 'true',
  
  // Matrícula
  ENROLLMENT_SYSTEM: process.env.NEXT_PUBLIC_FEATURE_ENROLLMENT === 'true',
  
  // Exportação PDF
  PDF_EXPORT: process.env.NEXT_PUBLIC_FEATURE_PDF_EXPORT === 'true',
  
  // Motor da Anamnese
  ANAMNESE_ENGINE: process.env.NEXT_PUBLIC_FEATURE_ANAMNESE_ENGINE === 'true',
  
  // Testes automatizados
  AUTOMATED_TESTS: process.env.NEXT_PUBLIC_FEATURE_AUTOMATED_TESTS === 'true'
} as const

export type FeatureKey = keyof typeof FEATURES
