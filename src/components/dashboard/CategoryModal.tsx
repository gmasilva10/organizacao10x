
import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Cake, Calendar, RefreshCw } from "lucide-react";
import ClientNameLink from "@/components/common/ClientNameLink";
import WhatsAppButton from "@/components/common/WhatsAppButton";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

const CategoryModal = ({ isOpen, onClose, category }: CategoryModalProps) => {
  // Define notification categories and their clients
  const notificationData = {
    "novos-clientes": {
      title: "Novos Clientes",
      icon: UserPlus,
      color: "bg-blue-100 text-blue-600",
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
    "aniversariantes": {
      title: "Aniversariantes",
      icon: Cake,
      color: "bg-purple-100 text-purple-600",
      clients: [
        { 
          id: "carlos-ferreira", 
          name: "Carlos Ferreira", 
          status: "Aniversário hoje", 
          initials: "CF", 
          bgColor: "bg-purple-100",
          attentionLevel: "high" as const,
          phone: "11888888888"
        }
      ]
    },
    "treinos": {
      title: "Treinos",
      icon: Calendar,
      color: "bg-green-100 text-green-600",
      clients: [
        { 
          id: "felipe-martins", 
          name: "Felipe Martins Silva", 
          status: "Treino pendente", 
          initials: "FS", 
          bgColor: "bg-green-100",
          attentionLevel: "low" as const,
          phone: "11777777777"
        }
      ]
    },
    "renovacoes": {
      title: "Renovações",
      icon: RefreshCw,
      color: "bg-yellow-100 text-yellow-600",
      clients: [
        { 
          id: "beatriz-souza", 
          name: "Beatriz Souza Santos", 
          status: "Renovação vencendo", 
          initials: "BS", 
          bgColor: "bg-yellow-100",
          attentionLevel: "medium" as const,
          phone: "11666666666"
        }
      ]
    }
  };

  const categoryData = notificationData[category as keyof typeof notificationData];

  if (!categoryData) return null;

  const IconComponent = categoryData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`${categoryData.color} bg-opacity-20 p-2 rounded-md`}>
            <IconComponent className={`h-5 w-5 ${categoryData.color.split(" ")[1]}`} />
          </div>
          <DialogTitle className="text-lg font-semibold">{categoryData.title}</DialogTitle>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {categoryData.clients.map(client => (
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
                <div className={`${client.bgColor} h-12 w-12 rounded-md flex items-center justify-center font-medium text-sm`}>
                  {client.initials}
                </div>
                <div>
                  <ClientNameLink
                    clientId={client.id}
                    clientName={client.name}
                    attentionLevel={client.attentionLevel}
                  />
                  <div className="text-sm text-gray-500 mt-1">{client.status}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <WhatsAppButton phone={client.phone} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;
