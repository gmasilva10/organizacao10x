
import React from "react";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import DraggableKanbanColumn from "./DraggableKanbanColumn";
import DataTransition from "@/components/common/DataTransition";
import { KanbanColumn as KanbanColumnType, AttentionLevel } from "@/types";

interface KanbanBoardContentProps {
  columns: KanbanColumnType[];
  loading: boolean;
  error: string | null;
  onAddCard: (columnId: string, clientName: string, content: string, attentionLevel: AttentionLevel) => void;
  onDeleteColumn: (columnId: string) => Promise<void>;
  onUpdate: () => Promise<void>;
}

const KanbanBoardContent = ({ 
  columns, 
  loading, 
  error, 
  onAddCard, 
  onDeleteColumn, 
  onUpdate 
}: KanbanBoardContentProps) => {
  return (
    <DataTransition loading={loading} error={error}>
      <SortableContext items={columns.map(col => `column-${col.id}`)} strategy={horizontalListSortingStrategy}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column, index) => (
            <DraggableKanbanColumn 
              key={column.id} 
              column={column}
              cards={column.cards || []}
              onAddCard={onAddCard}
              onDeleteColumn={onDeleteColumn}
              onUpdate={onUpdate}
              isFirstColumn={index === 0}
            />
          ))}
        </div>
      </SortableContext>
    </DataTransition>
  );
};

export default KanbanBoardContent;
