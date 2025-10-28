"use client"

/**
 * GATE 10.7.2 - Página de Relacionamento Otimizada
 * 
 * - Layout otimizado para maximizar espaço do Kanban
 * - Botões de visualização compactos no cabeçalho
 * - Foco na execução das mensagens
 */

import RelationshipKanban from "@/components/relationship/RelationshipKanban"

export default function RelationshipPage() {
  return (
    <div className="container py-6">
      <RelationshipKanban />
    </div>
  )
}
