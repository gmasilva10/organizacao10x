
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, Clock, Calendar, Bell } from "lucide-react";
import { ClientMessage } from "@/types";
import { clientMessages, messages, clients } from "@/services/mockData";
import ClientNameLink from "@/components/common/ClientNameLink";
import WhatsAppButton from "@/components/common/WhatsAppButton";

interface UnifiedTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "tasks" | "notifications";
}

const UnifiedTasksModal = ({ isOpen, onClose, initialTab = "tasks" }: UnifiedTasksModalProps) => {
  const [activeTab, setActiveTab] = useState<"tasks" | "notifications">(initialTab);
  const [taskFilter, setTaskFilter] = useState<string>("pending");
  const [notificationFilter, setNotificationFilter] = useState<string>("7dias");

  // Get filtered messages based on status
  const filteredMessages = clientMessages
    .filter(message => {
      if (taskFilter === "all") return true;
      if (taskFilter === "pending") return message.status === 'pending';
      if (taskFilter === "completed") return message.status === 'completed';
      return message.status === 'pending';
    })
    .map(clientMessage => {
      const message = messages.find(m => m.id === clientMessage.messageId);
      const client = clients.find(c => c.id === clientMessage.clientId);
      
      return {
        ...clientMessage,
        messageName: message?.code || '',
        messageContent: message?.description || '',
        client: client,
      };
    });

  // Define notification categories and their clients
  const notificationGroups = [
    {
      title: "Novos Clientes",
      value: "novos-clientes",
      count: 1,
      color: "bg-blue-100 text-blue-600",
      icon: Calendar,
      clients: [
        { 
          id: "pedro-santos", 
          name: "Pedro Santos Silva", 
          status: "Sem plano", 
          initials: "PS", 
          bgColor: "bg-blue-100",
          attentionLevel: "medium" as const,
          phone: "11999999999"
        }
      ]
    },
    {
      title: "Aniversariantes",
      value: "aniversariantes",
      count: 1,
      color: "bg-purple-100 text-purple-600",
      icon: Calendar,
      clients: [
        { 
          id: "carlos-ferreira", 
          name: "Carlos Ferreira", 
          status: "Sem plano", 
          initials: "CF", 
          bgColor: "bg-purple-100",
          attentionLevel: "high" as const,
          phone: "11888888888"
        }
      ]
    },
    {
      title: "Treinos",
      value: "treinos",
      count: 1,
      color: "bg-green-100 text-green-600",
      icon: Calendar,
      clients: [
        { 
          id: "felipe-martins", 
          name: "Felipe Martins Silva", 
          status: "Sem plano", 
          initials: "FS", 
          bgColor: "bg-green-100",
          attentionLevel: "low" as const,
          phone: "11777777777"
        }
      ]
    },
    {
      title: "Renovações",
      value: "renovacoes",
      count: 1,
      color: "bg-yellow-100 text-yellow-600",
      icon: Calendar,
      clients: [
        { 
          id: "beatriz-souza", 
          name: "Beatriz Souza Santos", 
          status: "Sem plano", 
          initials: "BS", 
          bgColor: "bg-yellow-100",
          attentionLevel: "medium" as const,
          phone: "11666666666"
        }
      ]
    }
  ];

  const [selectedNotificationTab, setSelectedNotificationTab] = useState(notificationGroups[0].value);
  
  const completedCount = clientMessages.filter(msg => msg.status === 'completed').length;
  const pendingCount = clientMessages.filter(msg => msg.status === 'pending').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogTitle>
          {activeTab === "tasks" ? "Todas as Tarefas" : "Todas as Notificações"}
        </DialogTitle>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "tasks" | "notifications")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tarefas Pendentes
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className={`${taskFilter === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-gray-100 text-gray-600 border-gray-200'} 
                  rounded-md px-4 py-2 flex items-center gap-2 cursor-pointer flex-1 text-center justify-center border`}
                onClick={() => setTaskFilter('pending')}
              >
                <Clock size={16} />
                <span>Pendentes ({pendingCount})</span>
              </div>
              <div 
                className={`${taskFilter === 'completed' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'} 
                  rounded-md px-4 py-2 flex items-center gap-2 cursor-pointer flex-1 text-center justify-center border`}
                onClick={() => setTaskFilter('completed')}
              >
                <Check size={16} />
                <span>Concluídas ({completedCount})</span>
              </div>
              <div 
                className={`${taskFilter === 'all' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'} 
                  rounded-md px-4 py-2 flex items-center gap-2 cursor-pointer flex-1 text-center justify-center border`}
                onClick={() => setTaskFilter('all')}
              >
                <span>Todas ({pendingCount + completedCount})</span>
              </div>
            </div>
            
            {filteredMessages.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                Não há tarefas {taskFilter === 'pending' ? 'pendentes' : taskFilter === 'completed' ? 'concluídas' : ''}
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {filteredMessages.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-4 rounded-md border ${
                      item.status === 'completed' ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'
                    }`}
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
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-500">
                        {new Date(item.scheduledDate).toLocaleDateString('pt-BR')}
                      </div>
                      {item.client?.phone && (
                        <WhatsAppButton phone={item.client.phone} size="sm" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-2 border-b overflow-x-auto pb-2">
                {notificationGroups.map(group => (
                  <div 
                    key={group.value} 
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer whitespace-nowrap ${
                      selectedNotificationTab === group.value 
                        ? 'border-b-2 border-blue-600 font-medium' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setSelectedNotificationTab(group.value)}
                  >
                    <group.icon className="h-4 w-4" />
                    {group.title} 
                    <span className={`${group.color} px-1.5 py-0.5 rounded-full text-xs`}>
                      {group.count}
                    </span>
                  </div>
                ))}
              </div>
              
              <select 
                className="text-sm border border-gray-200 rounded-md px-2 py-1"
                value={notificationFilter}
                onChange={(e) => setNotificationFilter(e.target.value)}
              >
                <option value="hoje">Hoje</option>
                <option value="7dias">7 dias</option>
                <option value="30dias">30 dias</option>
              </select>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {notificationGroups.map(group => (
                selectedNotificationTab === group.value && (
                  <div key={group.value} className="space-y-2">
                    {group.clients.map(client => (
                      <div 
                        key={client.id} 
                        className={`p-4 rounded-md flex items-center justify-between ${
                          client.bgColor === "bg-blue-100" ? "bg-blue-50 border border-blue-100" :
                          client.bgColor === "bg-purple-100" ? "bg-purple-50 border border-purple-100" :
                          client.bgColor === "bg-green-100" ? "bg-green-50 border border-green-100" :
                          "bg-yellow-50 border border-yellow-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`${client.bgColor} h-10 w-10 rounded-md flex items-center justify-center font-medium`}>
                            {client.initials}
                          </div>
                          <div>
                            <ClientNameLink
                              clientId={client.id}
                              clientName={client.name}
                              attentionLevel={client.attentionLevel}
                            />
                            <div className="text-sm text-gray-500">{client.status}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <WhatsAppButton phone={client.phone} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedTasksModal;
