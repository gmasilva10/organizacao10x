
import { KanbanColumn, KanbanCard } from '@/types';
import { calculateEndDate } from './kanbanUtils';

export function useCardDateUpdate(
  columns: KanbanColumn[],
  setColumns: React.Dispatch<React.SetStateAction<KanbanColumn[]>>,
  findColumnByCardId: (cardId: string) => KanbanColumn | undefined
) {
  const updateCardEndDate = (cardId: string, deliveryDate: Date) => {
    const column = findColumnByCardId(cardId);
    if (!column) return;
    
    const card = column.cards?.find(c => c.id === cardId);
    if (!card) return;
    
    const endDate = calculateEndDate(deliveryDate, card.serviceType || 'mensal');
    
    setColumns(prev => prev.map(column => {
      if (!column.cards?.some(c => c.id === cardId)) return column;
      
      return {
        ...column,
        cards: column.cards.map(c => {
          if (c.id !== cardId) return c;
          
          return {
            ...c,
            startDate: deliveryDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          };
        })
      };
    }));
    
    console.log(`Validade do plano iniciada em ${deliveryDate.toISOString()} até ${endDate.toISOString()} para o card ${cardId}`);
  };

  return {
    updateCardEndDate
  };
}
