
import { useState } from 'react';
import { KanbanColumn, KanbanCard } from '@/types';

export function useKanbanState(initialColumns: KanbanColumn[]) {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);

  // Find the column a card belongs to
  const findColumnByCardId = (cardId: string) => {
    return columns.find(column => 
      column.cards?.some(card => card.id === cardId)
    );
  };

  return {
    columns,
    setColumns,
    activeColumn,
    setActiveColumn,
    activeCard,
    setActiveCard,
    findColumnByCardId
  };
}
