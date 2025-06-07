import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRealClients } from "@/hooks/useRealClients";
import ClientHeader from "@/components/client-profile/ClientHeader";
import ClientProfileTabs from "@/components/client-profile/ClientProfileTabs";
import LoadingState from "@/components/client-profile/LoadingState";
import ErrorState from "@/components/client-profile/ErrorState";
import ConfirmDeleteClientDialog from "@/components/client-profile/ConfirmDeleteClientDialog";
import EditClientDialog from "@/components/client-profile/EditClientDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Client } from "@/types";

const ClientProfile = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [activeTab, setActiveTab] = useState("general");
  const navigate = useNavigate();
  const { clients, loading: isLoading, error, refetch } = useRealClients();
  const [client, setClient] = useState<Client | null>(null);
  
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  useEffect(() => {
    if (clients.length > 0 && clientId) {
      const currentClient = clients.find(c => c.id === clientId);
      setClient(currentClient || null);
    }
  }, [clients, clientId]);
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (error || (!isLoading && !client)) {
    return <ErrorState />;
  }

  const handleWhatsApp = () => {
    if (client.phone) {
      window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}`, '_blank');
    }
  };

  const handleEdit = () => {
    if (client) {
      setIsEditDialogOpen(true);
    } else {
      toast.error("Erro", { description: "Dados do cliente não disponíveis para edição." });
    }
  };

  const handleDelete = () => {
    setIsConfirmDeleteDialogOpen(true);
  };

  const executeDeleteClient = async () => {
    if (!client || !client.id) {
      toast.error("Erro interno", { description: "ID do cliente não encontrado." });
      return;
    }

    setIsDeletingClient(true);
    try {
      const { error } = await supabase
        .from('clients') 
        .delete()
        .eq('client_id', client.id);

      if (error) {
        throw error;
      }

      toast.success("Cliente excluído com sucesso!");
      navigate("/cadastro");

    } catch (error: any) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Falha ao excluir cliente", {
        description: error.message || "Não foi possível excluir o cliente. Por favor, tente novamente mais tarde."
      });
    } finally {
      setIsDeletingClient(false);
      setIsConfirmDeleteDialogOpen(false);
    }
  };

  const handleClientUpdated = () => {
    if (refetch) {
      console.log("[ClientProfile] Calling refetch after client update...");
      refetch();
    } else {
      console.warn("[ClientProfile] refetch function is not available. Page may not update immediately.");
    }
  };

  return (
    <div className="pb-6">
      <ClientHeader 
        client={client}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleWhatsApp={handleWhatsApp}
      />

      <ClientProfileTabs
        client={client}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {client && (
        <ConfirmDeleteClientDialog
          isOpen={isConfirmDeleteDialogOpen}
          onOpenChange={setIsConfirmDeleteDialogOpen}
          onConfirmDelete={executeDeleteClient}
          clientName={client.name || "este cliente"}
          isDeleting={isDeletingClient}
        />
      )}

      {client && isEditDialogOpen && (
        <EditClientDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          client={client}
          onClientUpdated={handleClientUpdated}
        />
      )}
    </div>
  );
};

export default ClientProfile;
