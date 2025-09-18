/**
 * Feature Flags - Controle de funcionalidades
 * 
 * Centraliza o controle de quais funcionalidades estão ativas
 * no sistema, permitindo fácil ativação/desativação.
 */

export const FEATURE_FLAGS = {
  // Analytics
  ANALYTICS_ENABLED: false, // A-10.2.4: Analytics desabilitado
  
  // Outros flags podem ser adicionados aqui
  // DEBUG_MODE: process.env.NODE_ENV === 'development',
  // BETA_FEATURES: false,
} as const

export type FeatureFlag = keyof typeof FEATURE_FLAGS
export type FeatureHookResult = { loading: boolean; enabled: boolean }

/**
 * Verifica se uma feature flag está ativa
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag]
}

/**
 * Hook para usar feature flags em componentes React
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return isFeatureEnabled(flag)
}

// Compatibilidade com Header: hook genérico por chave string
// Ex.: useFeature("features.onboarding.kanban")
export function useFeature(key: string): FeatureHookResult {
  const mapping: Record<string, boolean> = {
    // Onboarding Kanban habilitado por padrão em dev
    'features.onboarding.kanban': true,
  }

  const enabled = mapping[key] ?? false
  return { loading: false, enabled }
}