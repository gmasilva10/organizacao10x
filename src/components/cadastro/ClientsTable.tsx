import React, { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ClientForm from "./ClientForm";
import ClientTable from "./clients/ClientTable";
import ClientEmptyState from "./clients/ClientEmptyState";
import { useRealClients } from "@/hooks/useRealClients";
import DataTransition from "@/components/common/DataTransition";
import { Client } from "@/types";
import EditClientDialog from "@/components/client-profile/EditClientDialog";
import ClientSearch from "./clients/ClientSearch";
import ClientFilters from "./clients/ClientFilters";
import ClientActions from "./clients/ClientActions";
import ImportClientsDialog from "./import/ImportClientsDialog";
import ColumnCustomizer from "./clients/ColumnCustomizer";

const initialColumnVisibility = {
  email: true,
  phone: true,
  status: true,
  serviceType: true,
  campaignId: true,
};

const ClientsTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const savedVisibility = localStorage.getItem('clientColumnVisibility');
    return savedVisibility ? JSON.parse(savedVisibility) : initialColumnVisibility;
  });
  
  const { clients, loading, error, refetch } = useRealClients();
  
  useEffect(() => {
    localStorage.setItem('clientColumnVisibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const handleColumnVisibilityChange = (column: string, visible: boolean) => {
    setColumnVisibility(prev => ({ ...prev, [column]: visible }));
  };

  const handleExportXLSX = () => console.log("Exportando para XLSX");
  const handleExportCSV = () => console.log("Exportando para CSV");

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = searchTerm === "" || 
                            client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      const matchesService = serviceFilter === "all" || client.serviceType === serviceFilter;
      return matchesSearch && matchesStatus && matchesService;
    });
  }, [clients, searchTerm, statusFilter, serviceFilter]);

  const handleClientAdded = () => {
    setIsNewClientDialogOpen(false);
    refetch();
  };

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setIsEditDialogOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <ClientSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <ClientFilters 
            serviceFilter={serviceFilter}
            setServiceFilter={setServiceFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          <ColumnCustomizer 
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={handleColumnVisibilityChange}
          />
        </div>
        <ClientActions 
          onNewClient={() => setIsNewClientDialogOpen(true)}
          onImport={() => setIsImportDialogOpen(true)}
          onExportXLSX={handleExportXLSX}
          onExportCSV={handleExportCSV}
        />
      </div>

      <DataTransition loading={loading} error={error}>
        {filteredClients.length === 0 ? (
          <ClientEmptyState onNewClient={() => setIsNewClientDialogOpen(true)} />
        ) : (
          <ClientTable 
            filteredClients={filteredClients} 
            onActionComplete={refetch}
            onEditClient={handleEditClient}
            columnVisibility={columnVisibility}
          />
        )}
      </DataTransition>

      <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>Novo Cliente</DialogTitle>
          <ClientForm onClose={handleClientAdded} />
        </DialogContent>
      </Dialog>
      
      <ImportClientsDialog 
        isOpen={isImportDialogOpen} 
        onClose={() => setIsImportDialogOpen(false)} 
      />

      {clientToEdit && (
        <EditClientDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onClientUpdated={() => {
            setIsEditDialogOpen(false);
            setClientToEdit(null);
            refetch();
          }}
          client={clientToEdit}
        />
      )}
    </div>
  );
};

export default ClientsTable;
