
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import KanbanColumnComponent from "./KanbanColumn";
import { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType, AttentionLevel } from "@/types";

interface DraggableKanbanColumnProps {
  column: KanbanColumnType;
  cards: KanbanCardType[];
  onAddCard: (columnId: string, clientName: string, content: string, attentionLevel: AttentionLevel) => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdate?: () => void;
  isFirstColumn?: boolean;
}

const DraggableKanbanColumn = (props: DraggableKanbanColumnProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${props.column.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <KanbanColumnComponent
        {...props}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
      />
    </div>
  );
};

export default DraggableKanbanColumn;
