
import React from "react";
import { Button } from "@/components/ui/button";
import { Upload, Plus } from "lucide-react";
import ExportMenu from "../ExportMenu";

interface ClientActionsProps {
  onNewClient: () => void;
  onImport: () => void;
  onExportXLSX: () => void;
  onExportCSV: () => void;
}

const ClientActions = ({ 
  onNewClient, 
  onImport, 
  onExportXLSX, 
  onExportCSV 
}: ClientActionsProps) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1"
        onClick={onImport}
      >
        <Upload size={16} />
        Importar
      </Button>
      
      <ExportMenu 
        onExportXLSX={onExportXLSX} 
        onExportCSV={onExportCSV} 
      />
      
      <Button 
        size="sm" 
        className="flex items-center gap-1" 
        onClick={onNewClient}
      >
        <Plus size={16} />
        Novo Cliente
      </Button>
    </div>
  );
};

export default ClientActions;
