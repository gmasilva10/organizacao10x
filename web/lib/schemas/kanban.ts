import { z } from 'zod'

export const KanbanMoveSchema = z.object({
  cardId: z.string().uuid('ID do card deve ser um UUID válido'),
  fromColumnId: z.string().uuid('ID da coluna origem deve ser um UUID válido'),
  toColumnId: z.string().uuid('ID da coluna destino deve ser um UUID válido'),
  toIndex: z.number().int().min(0).optional()
})

export const KanbanReorderSchema = z.object({
  columnId: z.string().uuid('ID da coluna deve ser um UUID válido'),
  cardIds: z.array(z.string().uuid()).min(1, 'Deve ter pelo menos um card')
})

export const KanbanStageReorderSchema = z.array(z.object({
  id: z.string().uuid('ID do stage deve ser um UUID válido'),
  order: z.number().int().min(2).max(98, 'Ordem deve estar entre 2 e 98')
}))

export type KanbanMoveRequest = z.infer<typeof KanbanMoveSchema>
export type KanbanReorderRequest = z.infer<typeof KanbanReorderSchema>
export type KanbanStageReorderRequest = z.infer<typeof KanbanStageReorderSchema>
