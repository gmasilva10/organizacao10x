
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import KanbanCard from "./KanbanCard";
import { KanbanCard as KanbanCardType } from "@/types";

interface DraggableKanbanCardProps {
  card: KanbanCardType;
  columnColor: string;
  columnId: string;
  onUpdate?: () => void;
}

const DraggableKanbanCard = ({ card, columnColor, columnId, onUpdate }: DraggableKanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleUpdate = () => {
    console.log('Card updated:', card.id);
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <KanbanCard
        card={card}
        isDragging={isDragging}
        columnColor={columnColor}
        columnId={columnId}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default DraggableKanbanCard;
