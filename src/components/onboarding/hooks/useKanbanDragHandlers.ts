import { KanbanColumn, KanbanCard } from '@/types';

export function useKanbanDragHandlers(
  columns: KanbanColumn[],
  setColumns: React.Dispatch<React.SetStateAction<KanbanColumn[]>>,
  setActiveColumn: React.Dispatch<React.SetStateAction<KanbanColumn | null>>,
  setActiveCard: React.Dispatch<React.SetStateAction<KanbanCard | null>>,
  findColumnByCardId: (cardId: string) => KanbanColumn | undefined
) {
  const handleDragStart = (event: any) => {
    const { active } = event;
    const { id } = active;

    // Check if we're dragging a column
    if (id.toString().includes('column')) {
      const columnId = id.toString().split('-')[1];
      const column = columns.find(col => col.id === columnId);
      if (column) setActiveColumn(column);
      return;
    }

    // Otherwise, we're dragging a card
    const column = findColumnByCardId(id);
    if (!column) return;
    
    const card = column.cards?.find(c => c.id === id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // If the active and over items are the same, do nothing
    if (activeId === overId) return;

    // Check if we're dragging a column
    if (activeId.toString().includes('column') && overId.toString().includes('column')) {
      const activeColumnId = activeId.toString().split('-')[1];
      const overColumnId = overId.toString().split('-')[1];
      
      if (activeColumnId !== overColumnId) {
        setColumns(prev => {
          const activeColumnIndex = prev.findIndex(col => col.id === activeColumnId);
          const overColumnIndex = prev.findIndex(col => col.id === overColumnId);
          
          if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
            const newColumns = [...prev];
            const movedColumn = newColumns[activeColumnIndex];
            
            // Remove the active column from the array
            newColumns.splice(activeColumnIndex, 1);
            // Insert it at the new position
            newColumns.splice(overColumnIndex, 0, movedColumn);
            
            return newColumns;
          }
          
          return prev;
        });
      }
      return;
    }

    // Check if the active item is a card
    if (!activeId.toString().includes('column')) {
      const activeColumn = findColumnByCardId(activeId);
      const overColumn = overId.toString().includes('column') 
        ? columns.find(col => col.id === overId.toString().split('-')[1])
        : findColumnByCardId(overId);
      
      if (!activeColumn || !overColumn) return;

      // If we're dragging over a different column, move the card
      if (activeColumn.id !== overColumn.id) {
        setColumns(prev => {
          // Find the card to move
          const activeCard = activeColumn.cards?.find(card => card.id === activeId);
          if (!activeCard) return prev;

          return prev.map(column => {
            // Remove from source column
            if (column.id === activeColumn.id) {
              return {
                ...column,
                cards: column.cards?.filter(card => card.id !== activeId) || [],
              };
            }
            
            // Add to target column
            if (column.id === overColumn.id) {
              return {
                ...column,
                cards: [...(column.cards || []), activeCard],
              };
            }
            
            return column;
          });
        });
      }
    }
  };

  const handleDragEnd = () => {
    setActiveColumn(null);
    setActiveCard(null);
  };

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnd
  };
}
