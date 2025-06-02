
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SalesScript {
  id: string;
  month: string;
  leads: number;
  block1: number;
  block2: number;
  block3: number;
  sale: number;
}

export const useSalesScripts = () => {
  const { organization } = useAuth();
  const [scripts, setScripts] = useState<SalesScript[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<SalesScript | null>(null);
  const [scriptToDelete, setScriptToDelete] = useState<SalesScript | null>(null);

  useEffect(() => {
    if (!organization) return;

    const fetchScripts = async () => {
      try {
        const { data, error } = await supabase
          .from('sales_scripts')
          .select('*')
          .eq('organization_id', organization.organization_id)
          .order('sales_script_date', { ascending: false });

        if (error) throw error;

        const formattedScripts: SalesScript[] = data.map(script => ({
          id: script.sales_script_id,
          month: script.sales_script_name,
          leads: script.sales_script_whatsapp_reach,
          block1: script.sales_script_block1,
          block2: script.sales_script_block2,
          block3: script.sales_script_block3,
          sale: script.sales_script_purchase
        }));

        setScripts(formattedScripts);
      } catch (error) {
        console.error('Error fetching sales scripts:', error);
        toast.error('Erro ao carregar scripts de vendas');
      }
    };

    fetchScripts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('sales_scripts_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sales_scripts',
          filter: `organization_id=eq.${organization.organization_id}`
        }, 
        () => {
          fetchScripts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization]);

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
      const { error } = await supabase
        .from('sales_scripts')
        .delete()
        .eq('sales_script_id', scriptToDelete.id);

      if (error) throw error;

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
    scripts,
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
