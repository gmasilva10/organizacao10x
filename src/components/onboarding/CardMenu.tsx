
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Dumbbell, Trash2, Eye } from "lucide-react";
import { useClientMilestones } from "@/hooks/useClientMilestones";
import { KanbanCard } from "@/types";

interface CardMenuProps {
  clientId?: string;
  card?: KanbanCard;
  columnId?: string;
  onUpdate?: () => void;
  onClose?: () => void;
  onViewProfile: () => void;
}

const CardMenu = ({ clientId, card, columnId, onUpdate, onClose, onViewProfile }: CardMenuProps) => {
  const { loading, updateAnamnesis, updateWorkoutDelivery } = useClientMilestones();

  const handleAnamnesisClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!clientId) return;
    
    console.log('Iniciando anamnese para cliente:', clientId);
    const success = await updateAnamnesis(clientId);
    
    if (success) {
      console.log('Anamnese realizada com sucesso, movendo card para coluna col3');
      // Move card to anamnesis column (col3)
      moveCardToColumn('col3');
      if (onUpdate) onUpdate();
    }
    if (onClose) onClose();
  };

  const handleWorkoutDeliveryClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!clientId) return;
    
    console.log('Iniciando entrega de treino para cliente:', clientId);
    const success = await updateWorkoutDelivery(clientId);
    
    if (success) {
      console.log('Treino entregue com sucesso, removendo card do onboarding');
      // Remove card from onboarding (training completed)
      removeCardFromBoard();
      if (onUpdate) onUpdate();
    }
    if (onClose) onClose();
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Removendo card do onboarding:', card?.id);
    // Remove card from onboarding
    removeCardFromBoard();
    if (onUpdate) onUpdate();
    if (onClose) onClose();
  };

  const handleViewProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Abrindo perfil do cliente:', clientId);
    onViewProfile();
    if (onClose) onClose();
  };

  const moveCardToColumn = (targetColumnId: string) => {
    console.log('Movendo card para coluna:', targetColumnId);
    // Emit custom event to move card
    const event = new CustomEvent('moveCard', {
      detail: { cardId: card?.id, targetColumnId }
    });
    window.dispatchEvent(event);
  };

  const removeCardFromBoard = () => {
    console.log('Removendo card do board:', card?.id);
    // Emit custom event to remove card
    const event = new CustomEvent('removeCard', {
      detail: { cardId: card?.id }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="absolute right-0 top-6 z-10">
      <DropdownMenu open onOpenChange={(open) => !open && onClose?.()}>
        <DropdownMenuTrigger asChild>
          <div />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {clientId && (
            <DropdownMenuItem onClick={handleViewProfileClick}>
              <Eye size={16} className="mr-2" />
              Ver perfil completo
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={handleAnamnesisClick} 
            disabled={loading}
            className="text-blue-600"
          >
            <FileText size={16} className="mr-2" />
            Anamnese realizada
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleWorkoutDeliveryClick} 
            disabled={loading}
            className="text-green-600"
          >
            <Dumbbell size={16} className="mr-2" />
            Treino entregue
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleRemoveClick} className="text-red-600">
            <Trash2 size={16} className="mr-2" />
            Remover do onboarding
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CardMenu;
