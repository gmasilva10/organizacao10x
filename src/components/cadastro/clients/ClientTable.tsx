import React, { useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { campaigns } from "@/services/mockData";
import { cn } from "@/lib/utils";
import ClientNameLink from "@/components/common/ClientNameLink";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ClientTableProps {
  filteredClients: Client[];
  onActionComplete: () => void;
  onEditClient: (client: Client) => void;
  columnVisibility: Record<string, boolean>;
}

const ClientTable = ({ 
  filteredClients, 
  onActionComplete, 
  onEditClient,
  columnVisibility 
}: ClientTableProps) => {
  const navigate = useNavigate();

  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.name : "Desconhecida";
  };

  const handleViewClientProfile = (clientId: string) => {
    navigate(`/cliente/${clientId}`);
  };

  const handleEditClient = (client: Client) => {
    onEditClient(client);
  };

  return (
    <>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              {columnVisibility.email && <TableHead>Email</TableHead>}
              {columnVisibility.phone && <TableHead>Telefone</TableHead>}
              {columnVisibility.status && <TableHead>Status</TableHead>}
              {columnVisibility.serviceType && <TableHead>Serviço</TableHead>}
              {columnVisibility.campaignId && <TableHead>Campanha</TableHead>}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length + 2} className="text-center py-8">
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
                  {columnVisibility.email && <TableCell>{client.email}</TableCell>}
                  {columnVisibility.phone && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{client.phone}</span>
                        <WhatsAppButton phone={client.phone} size="sm" />
                      </div>
                    </TableCell>
                  )}
                  {columnVisibility.status && (
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        client.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {client.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                  )}
                  {columnVisibility.serviceType && <TableCell>{client.serviceType}</TableCell>}
                  {columnVisibility.campaignId && <TableCell>{getCampaignName(client.campaignId)}</TableCell>}
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
                        <DropdownMenuItem onClick={() => handleEditClient(client)}>
                          Editar
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
    </>
  );
};

export default ClientTable;
