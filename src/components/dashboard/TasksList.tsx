
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Filter } from "lucide-react";
import { clientMessages, messages, clients } from "@/services/mockData";
import ClientNameLink from "@/components/common/ClientNameLink";
import UnifiedTasksModal from "./UnifiedTasksModal";

const TasksList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState("hoje");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Get filtered messages based on filters
  const getFilteredMessages = () => {
    const now = new Date();
    let dateFilteredMessages = clientMessages;

    // Apply time filter
    if (timeFilter !== "todas") {
      dateFilteredMessages = clientMessages.filter(message => {
        const messageDate = new Date(message.scheduledDate);
        const diffTime = Math.abs(messageDate.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (timeFilter) {
          case "hoje":
            return messageDate.toDateString() === now.toDateString();
          case "7dias":
            return diffDays <= 7;
          case "30dias":
            return diffDays <= 30;
          case "vencidas":
            return messageDate < now && message.status === 'pending';
          default:
            return true;
        }
      });
    }

    // Apply status filter
    const statusFilteredMessages = dateFilteredMessages.filter(message => {
      if (statusFilter === "todas") return true;
      return message.status === statusFilter;
    });

    return statusFilteredMessages.map(clientMessage => {
      const message = messages.find(m => m.id === clientMessage.messageId);
      const client = clients.find(c => c.id === clientMessage.clientId);
      
      return {
        ...clientMessage,
        messageName: message?.code || '',
        messageContent: message?.description || '',
        client: client,
      };
    });
  };

  const filteredMessages = getFilteredMessages();
  const displayMessages = filteredMessages.slice(0, 5);
  
  return (
    <>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-700">Tarefas Pendentes</h3>
            <p className="text-sm text-gray-500">Atividades programadas a fazer</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            Ver todas
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-500" />
            <select 
              className="text-xs border border-gray-200 rounded px-2 py-1"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="hoje">Hoje</option>
              <option value="7dias">Próximos 7 dias</option>
              <option value="30dias">Próximos 30 dias</option>
              <option value="vencidas">Vencidas</option>
              <option value="todas">Todas as datas</option>
            </select>
          </div>
          
          <select 
            className="text-xs border border-gray-200 rounded px-2 py-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="pending">Pendentes</option>
            <option value="completed">Concluídas</option>
            <option value="todas">Todos os status</option>
          </select>
        </div>
        
        {filteredMessages.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Clock className="mx-auto mb-2 text-gray-400" size={32} />
              <p>Não há tarefas para os filtros selecionados.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayMessages.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100 hover:shadow-sm transition-shadow"
              >
                <div className="flex-1">
                  {item.client ? (
                    <ClientNameLink
                      clientId={item.client.id}
                      clientName={item.client.name}
                      attentionLevel={item.client.attentionLevel}
                    />
                  ) : (
                    <div className="font-medium">Cliente não encontrado</div>
                  )}
                  <div className="text-sm text-gray-500 mt-1">
                    {item.messageName}: {item.messageContent}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {new Date(item.scheduledDate).toLocaleDateString('pt-BR')}
                  </div>
                  {item.status === 'completed' && (
                    <div className="text-xs text-green-600 font-medium">Concluída</div>
                  )}
                </div>
              </div>
            ))}
            
            {filteredMessages.length > 5 && (
              <div className="text-center pt-2">
                <button 
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setIsModalOpen(true)}
                >
                  +{filteredMessages.length - 5} tarefas adicionais
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <UnifiedTasksModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialTab="tasks"
      />
    </>
  );
};

export default TasksList;
