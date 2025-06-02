
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ClientForm from "./ClientForm";
import { useRealClients } from "@/hooks/useRealClients";
import ClientSearch from "./clients/ClientSearch";
import ClientFilters from "./clients/ClientFilters";
import ClientActions from "./clients/ClientActions";
import ClientTable from "./clients/ClientTable";
import ClientEmptyState from "./clients/ClientEmptyState";
import ImportClientsDialog from "./import/ImportClientsDialog";
import DataTransition from "@/components/common/DataTransition";

const ClientsTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  const { clients, loading, error, refetch } = useRealClients();
  
  const handleExportXLSX = () => {
    console.log("Exportando para XLSX");
    // Lógica para exportar XLSX seria implementada aqui
  };

  const handleExportCSV = () => {
    console.log("Exportando para CSV");
    // Lógica para exportar CSV seria implementada aqui
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesService = serviceFilter === "all" || client.serviceType === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  const handleClientAdded = () => {
    setIsDialogOpen(false);
    refetch(); // Recarregar lista de clientes
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <ClientSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        <ClientActions 
          onNewClient={() => setIsDialogOpen(true)}
          onImport={() => setIsImportDialogOpen(true)}
          onExportXLSX={handleExportXLSX}
          onExportCSV={handleExportCSV}
        />
      </div>

      <div className="mb-4">
        <ClientFilters 
          serviceFilter={serviceFilter}
          setServiceFilter={setServiceFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>

      <DataTransition loading={loading} error={error}>
        {clients.length === 0 ? (
          <ClientEmptyState onNewClient={() => setIsDialogOpen(true)} />
        ) : (
          <ClientTable filteredClients={filteredClients} />
        )}
      </DataTransition>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>Novo Cliente</DialogTitle>
          <ClientForm onClose={handleClientAdded} />
        </DialogContent>
      </Dialog>
      
      <ImportClientsDialog 
        isOpen={isImportDialogOpen} 
        onClose={() => setIsImportDialogOpen(false)} 
      />
    </div>
  );
};

export default ClientsTable;
