
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { clients, services, campaigns, messages, clientMessages } from "@/services/mockData";
import StatusBadge from "./modal/StatusBadge";
import ClientInfoTab from "./modal/ClientInfoTab";
import ClientServicesTab from "./modal/ClientServicesTab";
import ClientProgressTab from "./modal/ClientProgressTab";
import ClientMessagesTab from "./modal/ClientMessagesTab";

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

const ClientDetailModal = ({ isOpen, onClose, clientId }: ClientDetailModalProps) => {
  const [activeTab, setActiveTab] = useState("info");
  const client = clients.find(c => c.id === clientId);
  
  if (!client) return null;
  
  // Find related data
  const service = services.find(s => {
    switch(client.serviceType) {
      case "monthly": return s.name === "Plano Mensal";
      case "quarterly": return s.name === "Plano Trimestral";
      case "biannual": return s.name === "Plano Semestral";
      case "annual": return s.name === "Plano Anual";
      default: return false;
    }
  });
  
  const campaign = campaigns.find(c => c.id === client.campaignId);
  
  const clientMsgs = clientMessages
    .filter(msg => msg.clientId === clientId)
    .map(msg => {
      const message = messages.find(m => m.id === msg.messageId);
      return {
        ...msg,
        title: message?.code,
        description: message?.description,
        content: message?.content,
      };
    });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{client.name}</span>
            <StatusBadge attentionLevel={client.attentionLevel} status={client.status} />
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="progress">Progresso</TabsTrigger>
            <TabsTrigger value="messages">Comunicações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info">
            <ClientInfoTab client={client} />
          </TabsContent>
          
          <TabsContent value="services">
            <ClientServicesTab client={client} service={service} campaign={campaign} />
          </TabsContent>
          
          <TabsContent value="progress">
            <ClientProgressTab client={client} />
          </TabsContent>
          
          <TabsContent value="messages">
            <ClientMessagesTab clientMessages={clientMsgs} clientName={client.name} />
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailModal;
