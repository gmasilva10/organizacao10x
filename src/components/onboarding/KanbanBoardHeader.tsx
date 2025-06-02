
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface KanbanBoardHeaderProps {
  onAddColumn: () => void;
}

const KanbanBoardHeader = ({ onAddColumn }: KanbanBoardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">Processo de Onboarding</h2>
      <Button size="sm" className="flex items-center gap-1" onClick={onAddColumn}>
        <Plus size={16} />
        Nova Etapa
      </Button>
    </div>
  );
};

export default KanbanBoardHeader;
