/**
 * GATE 10.8 - Plans Manager Component
 * Wrapper do módulo de planos para uso no Financeiro
 */

'use client'

import dynamic from 'next/dynamic'

// Importar o conteúdo da página de planos
const PlansPage = dynamic(() => import('@/app/(app)/app/services/plans/page'), {
  ssr: false
})

export default function PlansManager() {
  return <PlansPage />
}
