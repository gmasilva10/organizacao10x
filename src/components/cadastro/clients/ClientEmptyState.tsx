
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ClientEmptyStateProps {
  onNewClient: () => void;
}

const ClientEmptyState = ({ onNewClient }: ClientEmptyStateProps) => {
  return (
    <div className="text-center py-12 border rounded-md">
      <h3 className="text-lg font-medium mb-2">Nenhum cliente cadastrado</h3>
      <p className="text-gray-500 mb-4">Comece adicionando seu primeiro cliente</p>
      <Button 
        onClick={onNewClient}
        className="flex items-center gap-1"
      >
        <Plus size={16} />
        Adicionar Cliente
      </Button>
    </div>
  );
};

export default ClientEmptyState;
