
import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toast } from "sonner";
import KanbanBoardHeader from "./KanbanBoardHeader";
import KanbanBoardContent from "./KanbanBoardContent";
import KanbanDragOverlay from "./KanbanDragOverlay";
import AddColumnDialog from "./AddColumnDialog";
import { AttentionLevel, KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from "@/types";
import { useRealKanbanData } from "@/hooks/useRealKanbanData";

const KanbanBoardCore = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<KanbanCardType | null>(null);
  const [activeColumn, setActiveColumn] = useState<KanbanColumnType | null>(null);
  const { 
    columns, 
    loading, 
    error, 
    updateCardColumn, 
    removeCard, 
    addColumn, 
    removeColumn,
    refetch 
  } = useRealKanbanData();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const moveCardToColumn = async (cardId: string, targetColumnId: string) => {
    try {
      await updateCardColumn(cardId, targetColumnId);
      toast.success('Card movido com sucesso');
    } catch (error) {
      console.error('Erro ao mover card:', error);
      toast.error('Erro ao mover card');
    }
  };

  const removeCardFromBoard = async (cardId: string) => {
    try {
      await removeCard(cardId);
      toast.success('Card removido do onboarding');
    } catch (error) {
      console.error('Erro ao remover card:', error);
      toast.error('Erro ao remover card');
    }
  };

  const handleAddCard = (columnId: string, clientName: string, content: string, attentionLevel: AttentionLevel) => {
    console.log('Adding new card:', { columnId, clientName, content, attentionLevel });
    toast.info('Funcionalidade de adicionar card será implementada em breve');
  };

  const addNewColumn = async (title: string, color: string) => {
    try {
      await addColumn(title, color);
      toast.success('Nova etapa criada');
    } catch (error) {
      console.error('Erro ao criar coluna:', error);
      toast.error('Erro ao criar nova etapa');
    }
  };
  
  const handleDeleteColumn = async (columnId: string) => {
    try {
      await removeColumn(columnId);
      toast.success('Etapa removida');
    } catch (error) {
      console.error('Erro ao remover coluna:', error);
      toast.error('Erro ao remover etapa');
    }
  };
  
  const findColumnByCardId = (cardId: string) => {
    return columns.find(column => 
      column.cards?.some(card => card.id === cardId)
    );
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;

    if (activeId.startsWith('column-')) {
      const columnId = activeId.replace('column-', '');
      const column = columns.find(col => col.id === columnId);
      if (column) {
        setActiveColumn(column);
      }
      return;
    }

    const column = findColumnByCardId(activeId);
    if (column) {
      const card = column.cards?.find(c => c.id === activeId);
      if (card) setActiveCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    if (activeId.startsWith('column-') && overId.startsWith('column-')) {
      return;
    }

    if (!activeId.startsWith('column-') && !overId.startsWith('column-')) {
      const activeColumn = findColumnByCardId(activeId);
      const overColumn = columns.find(col => col.id === overId) || findColumnByCardId(overId);

      if (!activeColumn || !overColumn) return;

      if (activeColumn.id !== overColumn.id) {
        moveCardToColumn(activeId, overColumn.id);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveColumn(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith('column-') && overId.startsWith('column-')) {
      console.log('Reordering columns not implemented yet');
      return;
    }

    const activeColumn = findColumnByCardId(activeId);
    const overColumn = findColumnByCardId(overId) || columns.find(col => col.id === overId);

    if (!activeColumn || !overColumn) return;

    if (activeColumn.id !== overColumn.id) {
      moveCardToColumn(activeId, overColumn.id);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div>
        <KanbanBoardHeader onAddColumn={() => setIsDialogOpen(true)} />
        
        <KanbanBoardContent
          columns={columns}
          loading={loading}
          error={error}
          onAddCard={handleAddCard}
          onDeleteColumn={handleDeleteColumn}
          onUpdate={refetch}
        />

        <KanbanDragOverlay 
          activeColumn={activeColumn}
          activeCard={activeCard}
        />

        <AddColumnDialog 
          isOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          onAddColumn={addNewColumn}
        />
      </div>
    </DndContext>
  );
};

export default KanbanBoardCore;
