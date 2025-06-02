
import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DraggableKanbanCard from "./DraggableKanbanCard";
import AddCardDialog from "./AddCardDialog";
import ClientForm from "@/components/cadastro/ClientForm";
import { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType, AttentionLevel } from "@/types";

interface KanbanColumnProps {
  column: KanbanColumnType;
  cards: KanbanCardType[];
  onAddCard: (columnId: string, clientName: string, content: string, attentionLevel: AttentionLevel) => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdate?: () => void;
  dragHandleProps?: any;
  isFirstColumn?: boolean;
}

const KanbanColumn = ({ 
  column, 
  cards, 
  onAddCard,
  onDeleteColumn,
  onUpdate,
  dragHandleProps,
  isFirstColumn = false
}: KanbanColumnProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const handleAddCard = (clientName: string, content: string, attentionLevel: AttentionLevel) => {
    onAddCard(column.id, clientName, content, attentionLevel);
    setIsDialogOpen(false);
  };

  const handleDeleteColumn = () => {
    onDeleteColumn(column.id);
  };

  const handleClientFormClose = () => {
    setIsClientFormOpen(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <>
      <div className="kanban-column">
        <div className="font-medium mb-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            >
              <GripVertical size={16} className="text-gray-400" />
            </div>
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: column.color.startsWith('#') ? column.color : `var(--${column.color})` }}
            />
            <span>{column.title}</span>
            <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-700 font-semibold">
              {cards.length}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Only show add button on first column */}
            {isFirstColumn && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsClientFormOpen(true)}
                title="Cadastrar novo aluno"
              >
                <Plus size={14} />
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Etapa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a etapa "{column.title}"? 
                    {cards.length > 0 && ` Esta etapa contém ${cards.length} card(s).`}
                    <br />
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteColumn}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <SortableContext 
          items={cards.map(card => card.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div ref={setNodeRef} className="space-y-3 min-h-[100px]">
            {cards.map((card) => (
              <DraggableKanbanCard 
                key={card.id} 
                card={card} 
                columnColor={column.color}
                columnId={column.id}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      {/* Dialog for client registration in first column only */}
      {isFirstColumn && (
        <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
            </DialogHeader>
            <ClientForm onClose={handleClientFormClose} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default KanbanColumn;
