
import React from "react";
import { DragOverlay } from "@dnd-kit/core";
import KanbanCard from "./KanbanCard";
import { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from "@/types";

interface KanbanDragOverlayProps {
  activeColumn: KanbanColumnType | null;
  activeCard: KanbanCardType | null;
}

const KanbanDragOverlay = ({ activeColumn, activeCard }: KanbanDragOverlayProps) => {
  return (
    <DragOverlay>
      {activeColumn ? (
        <div className="kanban-column opacity-50">
          <div className="font-medium mb-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: activeColumn.color.startsWith('#') ? activeColumn.color : `var(--${activeColumn.color})` }}
              />
              <span>{activeColumn.title}</span>
            </div>
          </div>
        </div>
      ) : activeCard ? (
        <KanbanCard
          card={activeCard}
          columnColor="#3b82f6"
          columnId="overlay"
          isDragging={true}
        />
      ) : null}
    </DragOverlay>
  );
};

export default KanbanDragOverlay;
