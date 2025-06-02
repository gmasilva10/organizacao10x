
import { useState } from "react";
import { useRealSalesScripts, SalesScript } from "@/hooks/useRealSalesScripts";
import { toast } from "sonner";

export const useSalesScriptDialog = () => {
  const { deleteScript } = useRealSalesScripts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<SalesScript | null>(null);
  const [scriptToDelete, setScriptToDelete] = useState<SalesScript | null>(null);

  const handleEdit = (script: SalesScript) => {
    setEditingScript(script);
    setIsDialogOpen(true);
  };

  const handleDelete = (script: SalesScript) => {
    setScriptToDelete(script);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!scriptToDelete) return;

    try {
      await deleteScript(scriptToDelete.id);
      toast.success('Script deletado com sucesso!');
      setIsDeleteDialogOpen(false);
      setScriptToDelete(null);
    } catch (error) {
      console.error('Error deleting script:', error);
      toast.error('Erro ao deletar script');
    }
  };

  const handleAddScript = () => {
    setEditingScript(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingScript(null);
  };

  return {
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
  };
};
