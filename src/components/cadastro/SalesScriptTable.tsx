
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SalesScriptForm from "./sales/SalesScriptForm";
import SalesScriptsTable from "./sales/SalesScriptsTable";
import SalesScriptDeleteDialog from "./sales/SalesScriptDeleteDialog";
import DataTransition from "@/components/common/DataTransition";
import { useRealSalesScripts } from "@/hooks/useRealSalesScripts";
import { useSalesScriptDialog } from "./sales/hooks/useSalesScriptDialog";

const SalesScriptTable = () => {
  const { scripts, loading, error } = useRealSalesScripts();
  const {
    isDialogOpen,
    isDeleteDialogOpen,
    editingScript,
    scriptToDelete,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleAddScript,
    handleCloseDialog,
    setIsDeleteDialogOpen
  } = useSalesScriptDialog();

  // Transform scripts to match expected format
  const transformedScripts = scripts.map(script => ({
    id: script.id,
    month: script.name, // Use name as month for display
    leads: script.whatsappReach,
    block1: script.block1,
    block2: script.block2,
    block3: script.block3,
    sale: script.purchase
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Script de Vendas</h2>
        <Button 
          size="sm" 
          className="flex items-center gap-1" 
          onClick={handleAddScript}
        >
          <Plus size={16} />
          Novo Script
        </Button>
      </div>

      <DataTransition loading={loading} error={error}>
        <SalesScriptsTable 
          scripts={transformedScripts}
          onEdit={(script) => handleEdit(scripts.find(s => s.id === script.id)!)}
          onDelete={(script) => handleDelete(scripts.find(s => s.id === script.id)!)}
        />
      </DataTransition>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogTitle>{editingScript ? "Editar Script" : "Novo Script"}</DialogTitle>
          <SalesScriptForm 
            onClose={handleCloseDialog}
            script={editingScript}
          />
        </DialogContent>
      </Dialog>

      <SalesScriptDeleteDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        scriptName={scriptToDelete?.name || ""}
      />
    </div>
  );
};

export default SalesScriptTable;
