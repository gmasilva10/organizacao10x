
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Check, MessageSquare } from "lucide-react";
import { clientMessages, messages, clients } from "@/services/mockData";
import WhatsAppButton from "@/components/common/WhatsAppButton";

interface ClientCommunicationsViewProps {
  clientId: string;
}

const ClientCommunicationsView = ({ clientId }: ClientCommunicationsViewProps) => {
  const client = clients.find(c => c.id === clientId);
  
  // Get all messages for this client
  const clientMsgs = clientMessages
    .filter(msg => msg.clientId === clientId)
    .map(clientMessage => {
      const message = messages.find(m => m.id === clientMessage.messageId);
      return {
        ...clientMessage,
        messageCode: message?.code || '',
        messageDescription: message?.description || '',
        messageContent: message?.content || '',
        messageCategory: message?.category || 'Acompanhamento',
      };
    })
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  const handleMarkAsSent = (messageId: string) => {
    console.log(`Marking message ${messageId} as sent`);
    // In real app, would update the message status in the database
  };

  const handleEditMessage = (messageId: string) => {
    console.log(`Editing message ${messageId}`);
    // In real app, would open edit dialog
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "sent": return "bg-green-100 text-green-700";
      case "completed": return "bg-blue-100 text-blue-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "failed": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case "sent": return "Enviada";
      case "completed": return "Concluída";
      case "pending": return "Pendente";
      case "failed": return "Falhou";
      default: return "Desconhecido";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Histórico de Comunicações</h3>
        <div className="text-sm text-gray-500">
          Total: {clientMsgs.length} mensagens
        </div>
      </div>
      
      {clientMsgs.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma comunicação registrada</p>
          <p className="text-gray-400 text-sm">As mensagens aparecerão aqui conforme o relacionamento for desenvolvido</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clientMsgs.map((msg) => (
            <div 
              key={msg.id} 
              className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-blue-600">{msg.messageCode}</span>
                    <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {msg.messageCategory}
                    </span>
                    <span 
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(msg.status)}`}
                    >
                      {getStatusLabel(msg.status)}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{msg.messageDescription}</h4>
                  <p className="text-sm text-gray-600 mb-2">{msg.messageContent}</p>
                  <div className="text-xs text-gray-500">
                    Data limite: {new Date(msg.scheduledDate).toLocaleDateString("pt-BR")}
                    {msg.sentDate && (
                      <span className="ml-4">
                        Enviada em: {new Date(msg.sentDate).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <WhatsAppButton phone={client?.phone} size="sm" />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditMessage(msg.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit size={14} />
                  </Button>
                  
                  {msg.status === "pending" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleMarkAsSent(msg.id)}
                      className="flex items-center gap-1"
                    >
                      <Check size={14} />
                      Enviada
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientCommunicationsView;
