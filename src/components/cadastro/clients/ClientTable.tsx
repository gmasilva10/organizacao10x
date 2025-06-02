
import React from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { campaigns } from "@/services/mockData";
import { cn } from "@/lib/utils";
import ClientNameLink from "@/components/common/ClientNameLink";
import WhatsAppButton from "@/components/common/WhatsAppButton";

interface ClientTableProps {
  filteredClients: Client[];
}

const ClientTable = ({ filteredClients }: ClientTableProps) => {
  const navigate = useNavigate();

  const getServiceName = (serviceType: string) => {
    switch(serviceType) {
      case "monthly": return "Plano Mensal";
      case "quarterly": return "Plano Trimestral";
      case "biannual": return "Plano Semestral";
      case "annual": return "Plano Anual";
      default: return "Desconhecido";
    }
  };

  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.name : "Desconhecida";
  };

  const handleViewClientProfile = (clientId: string) => {
    navigate(`/cliente/${clientId}`);
  };

  const handleEditClient = (clientId: string) => {
    // This would open an edit dialog in a real implementation
    console.log("Edit client:", clientId);
  };

  const handleDeactivateClient = (clientId: string) => {
    // This would open a confirmation dialog in a real implementation
    console.log("Deactivate client:", clientId);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Campanha</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <p className="text-gray-500 font-medium">Nenhum cliente encontrado</p>
                <p className="text-gray-400 text-sm">Tente ajustar seus filtros ou adicionar novos clientes</p>
              </TableCell>
            </TableRow>
          ) : (
            filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <ClientNameLink
                    clientId={client.id}
                    clientName={client.name}
                    attentionLevel={client.attentionLevel}
                  />
                </TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{client.phone}</span>
                    <WhatsAppButton phone={client.phone} size="sm" />
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs",
                    client.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  )}>
                    {client.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>{getServiceName(client.serviceType)}</TableCell>
                <TableCell>{getCampaignName(client.campaignId)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewClientProfile(client.id)}>
                        Ver perfil completo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditClient(client.id)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeactivateClient(client.id)}
                      >
                        Desativar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientTable;
