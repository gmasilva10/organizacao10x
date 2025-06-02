
import React, { useState } from "react";
import { clientMessages, messages, clients } from "@/services/mockData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MessageCircle, Calendar } from "lucide-react";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import ClientDetailModal from "@/components/onboarding/ClientDetailModal";

const KanbanView = () => {
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const startOfNextWeek = new Date(endOfWeek);
  startOfNextWeek.setDate(endOfWeek.getDate() + 1);
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

  const categorizeMessages = () => {
    const delayed: any[] = [];
    const forToday: any[] = [];
    const forTomorrow: any[] = [];
    const forThisWeek: any[] = [];
    const forNextWeek: any[] = [];
    
    clientMessages
      .filter(message => message.status === "pending")
      .forEach(clientMessage => {
        const message = messages.find(m => m.id === clientMessage.messageId);
        const client = clients.find(c => c.id === clientMessage.clientId);
        const scheduledDate = new Date(clientMessage.scheduledDate);
        scheduledDate.setHours(0, 0, 0, 0);
        
        const enrichedMessage = {
          ...clientMessage,
          messageName: message?.code || '',
          messageContent: message?.description || '',
          clientName: client?.name || '',
          clientPhone: client?.phone || '',
          clientId: client?.id || '',
          scheduledDateObj: scheduledDate,
        };
        
        if (scheduledDate < today) {
          delayed.push(enrichedMessage);
        } else if (scheduledDate.getTime() === today.getTime()) {
          forToday.push(enrichedMessage);
        } else if (scheduledDate.getTime() === tomorrow.getTime()) {
          forTomorrow.push(enrichedMessage);
        } else if (
          scheduledDate >= startOfWeek && 
          scheduledDate <= endOfWeek
        ) {
          forThisWeek.push(enrichedMessage);
        } else if (
          scheduledDate >= startOfNextWeek && 
          scheduledDate <= endOfNextWeek
        ) {
          forNextWeek.push(enrichedMessage);
        }
      });
    
    return {
      delayed,
      forToday,
      forTomorrow,
      forThisWeek,
      forNextWeek,
    };
  };

  const columns = categorizeMessages();

  const handleCardClick = (message: any) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);
  };

  const handleClientNameClick = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClientId(clientId);
    setIsClientModalOpen(true);
  };

  const renderCard = (message: any) => (
    <div
      key={message.id}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer p-5 space-y-4 hover:border-blue-300"
      onClick={() => handleCardClick(message)}
    >
      {/* Header with client name and priority indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={(e) => handleClientNameClick(message.clientId, e)}
          className="text-blue-600 hover:text-blue-800 font-bold text-left hover:underline flex items-center gap-2 transition-colors"
        >
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          {message.clientName}
        </button>
        {message.clientPhone && (
          <WhatsAppButton phone={message.clientPhone} size="sm" />
        )}
      </div>

      {/* Message info with better visual hierarchy */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-blue-500" />
          <span className="font-semibold text-sm text-gray-800 bg-blue-50 px-2 py-1 rounded-md">
            {message.messageName}
          </span>
        </div>
        <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed bg-gray-50 p-3 rounded-lg">
          {message.messageContent}
        </p>
      </div>

      {/* Date and status */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <Badge variant="outline" className="text-xs font-medium">
            {message.scheduledDateObj.toLocaleDateString("pt-BR")}
          </Badge>
        </div>
        <Badge className="bg-orange-100 text-orange-800 text-xs">
          Pendente
        </Badge>
      </div>
    </div>
  );

  const renderColumn = (title: string, messages: any[], color: string, bgColor: string) => (
    <div className="kanban-column min-w-[320px]">
      <div className="flex items-center mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">
        <div className={`w-4 h-4 rounded-full ${color} mr-3 shadow-sm`} />
        <h2 className="font-bold text-gray-800 text-lg">{title}</h2>
        {messages.length > 0 && (
          <Badge variant="secondary" className={`ml-3 ${bgColor} text-sm font-bold px-3 py-1 rounded-full`}>
            {messages.length}
          </Badge>
        )}
      </div>
      
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Clock size={32} className="mx-auto mb-3 text-gray-400" />
            <p className="font-medium">Nenhuma mensagem</p>
            <p className="text-xs text-gray-400 mt-1">para {title.toLowerCase()}</p>
          </div>
        ) : (
          messages.map(renderCard)
        )}
      </div>
    </div>
  );

  return (
    <div className="flex gap-8 overflow-x-auto pb-8">
      {renderColumn("Atrasadas", columns.delayed, "bg-red-500", "bg-red-100 text-red-800")}
      {renderColumn("Hoje", columns.forToday, "bg-blue-500", "bg-blue-100 text-blue-800")}
      {renderColumn("Amanhã", columns.forTomorrow, "bg-green-500", "bg-green-100 text-green-800")}
      {renderColumn("Esta Semana", columns.forThisWeek, "bg-purple-500", "bg-purple-100 text-purple-800")}
      {renderColumn("Próxima Semana", columns.forNextWeek, "bg-yellow-500", "bg-yellow-100 text-yellow-800")}
      
      {/* Message Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Detalhes da Mensagem</DialogTitle>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-600">Cliente</span>
                </div>
                <div className="font-medium">{selectedMessage.clientName}</div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Código da Mensagem</div>
                  <div className="font-medium">{selectedMessage.messageName}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Descrição</div>
                  <div className="text-sm bg-gray-50 p-3 rounded">{selectedMessage.messageContent}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Data Agendada</div>
                  <Badge variant="outline">
                    {selectedMessage.scheduledDateObj.toLocaleDateString("pt-BR")}
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Fechar
                </Button>
                
                <div className="flex gap-2">
                  <a 
                    href={`https://wa.me/${selectedMessage.clientPhone?.replace(/\D/g, '')}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-green-500 text-white hover:bg-green-600 h-9 px-4"
                  >
                    WhatsApp
                  </a>
                  
                  <Button size="sm">
                    Marcar como enviada
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Client Detail Modal - using the standard modal */}
      {selectedClientId && (
        <ClientDetailModal
          isOpen={isClientModalOpen}
          onClose={() => {
            setIsClientModalOpen(false);
            setSelectedClientId(null);
          }}
          clientId={selectedClientId}
        />
      )}
    </div>
  );
};

export default KanbanView;
