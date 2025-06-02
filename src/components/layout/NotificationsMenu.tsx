import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ClientNameLink from "@/components/common/ClientNameLink";
import WhatsAppButton from "@/components/common/WhatsAppButton";

// Mock data para notificações do dia
const todayNotifications: any[] = []; // Zerado e tipagem ajustada para any[] temporariamente se a estrutura interna for complexa e não necessária para um array vazio.

const NotificationsMenu = () => {
  const [open, setOpen] = useState(false);

  const getTypeColor = (type: string) => {
    switch(type) {
      case "Aniversário": return "bg-purple-100 text-purple-600";
      case "Treino Pendente": return "bg-green-100 text-green-600";
      case "Renovação": return "bg-yellow-100 text-yellow-600";
      case "Novo Cliente": return "bg-blue-100 text-blue-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const handleNotificationClick = (notification: any) => {
    // Aqui você pode implementar a navegação específica baseada no tipo
    console.log("Navegando para notificação:", notification);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {todayNotifications.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {todayNotifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Notificações de Hoje</h3>
            <Badge variant="secondary" className="text-xs">
              {todayNotifications.length}
            </Badge>
          </div>
          
          {todayNotifications.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Bell className="mx-auto mb-2 text-gray-400" size={24} />
              <p className="text-sm">Nenhuma notificação para hoje</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {todayNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div 
                    className="p-3 rounded-md border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getTypeColor(notification.type)}`}
                          >
                            {notification.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.dueDate)}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-2">{notification.title}</p>
                        
                        {notification.client && (
                          <div className="flex items-center justify-between">
                            <ClientNameLink
                              clientId={notification.client.id}
                              clientName={notification.client.name}
                              attentionLevel={notification.client.attentionLevel}
                              className="text-sm"
                            />
                            <WhatsAppButton 
                              phone={notification.client.phone} 
                              size="sm" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {index < todayNotifications.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsMenu;
