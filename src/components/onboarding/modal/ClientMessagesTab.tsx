
import React from "react";
import { Button } from "@/components/ui/button";
import { ClientMessage } from "@/types";

interface ClientMessagesTabProps {
  clientMessages: {
    id: string;
    title?: string;
    description?: string;
    content?: string;
    status: "pending" | "sent" | "failed" | "completed";
    scheduledDate: string;
    sentDate?: string;
  }[];
  clientName: string;
}

const ClientMessagesTab = ({ clientMessages, clientName }: ClientMessagesTabProps) => {
  const sentMessages = clientMessages.filter(msg => msg.status === "sent");
  const pendingMessages = clientMessages.filter(msg => msg.status === "pending");
  
  return (
    <div className="mt-4">
      <div className="space-y-4">
        <h3 className="font-medium mb-2">Mensagens Enviadas</h3>
        {sentMessages.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            Nenhuma mensagem enviada.
          </div>
        ) : (
          <div className="space-y-2">
            {sentMessages.map(msg => (
              <div key={msg.id} className="p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between">
                  <span className="font-medium">{msg.title} - {msg.description}</span>
                  <span className="text-xs text-gray-500">
                    {msg.sentDate && new Date(msg.sentDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {msg.content?.replace("{nome}", clientName.split(" ")[0])}
                </p>
              </div>
            ))}
          </div>
        )}
        
        <h3 className="font-medium mb-2">Mensagens Pendentes</h3>
        {pendingMessages.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            Nenhuma mensagem pendente.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingMessages.map(msg => (
              <div key={msg.id} className="p-3 bg-yellow-50 rounded-md">
                <div className="flex justify-between">
                  <span className="font-medium">{msg.title} - {msg.description}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.scheduledDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {msg.content?.replace("{nome}", clientName.split(" ")[0])}
                </p>
                <Button size="sm" className="mt-2">
                  Marcar como enviada
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientMessagesTab;
