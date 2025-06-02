
import { KanbanColumn, KanbanCard, AttentionLevel } from '@/types';

export function useKanbanActions(
  columns: KanbanColumn[],
  setColumns: React.Dispatch<React.SetStateAction<KanbanColumn[]>>,
  findColumnByCardId: (cardId: string) => KanbanColumn | undefined
) {
  const addNewColumn = (title: string, color: string) => {
    const newColumn: KanbanColumn = {
      id: `col-${Date.now()}`,
      title,
      color,
      cards: []
    };
    
    setColumns([...columns, newColumn]);
  };

  const addNewCard = (columnId: string, clientName: string, content: string, attentionLevel: AttentionLevel) => {
    // Parse service type from content if available
    const serviceMatch = content.match(/(Mensal|Trimestral|Semestral|Anual)/i);
    const serviceType = serviceMatch ? serviceMatch[0] : "Mensal";
    
    const newCard: KanbanCard = {
      id: `card-${Date.now()}`,
      clientId: `client-${Date.now()}`, // In a real app, this would be a real client ID
      clientName,
      clientEmail: content.includes('@') ? content : `${clientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      content,
      serviceType,
      isActive: true,
      attentionLevel,
    };

    setColumns(prev => 
      prev.map(column => {
        if (column.id === columnId) {
          return {
            ...column,
            cards: [...(column.cards || []), newCard]
          };
        }
        return column;
      })
    );
  };
  
  const moveCardToColumn = (cardId: string, targetColumnId: string) => {
    const sourceColumn = findColumnByCardId(cardId);
    if (!sourceColumn) return;
    
    const card = sourceColumn.cards?.find(c => c.id === cardId);
    if (!card) return;
    
    setColumns(prev => prev.map(column => {
      // Remove from source column
      if (column.id === sourceColumn.id) {
        return {
          ...column,
          cards: column.cards?.filter(c => c.id !== cardId) || []
        };
      }
      
      // Add to target column
      if (column.id === targetColumnId) {
        return {
          ...column,
          cards: [...(column.cards || []), card]
        };
      }
      
      return column;
    }));
  };

  return {
    addNewColumn,
    addNewCard,
    moveCardToColumn
  };
}
