
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { toast } from "sonner";
import { Clock, CheckCircle } from "lucide-react";

interface ClientCardProps {
  clientId: string;
  clientName: string;
  clientPhone: string;
  messageCode: string;
  messageContent: string;
  attentionLevel: "low" | "medium" | "high";
  scheduledDate: string;
  status: "pending" | "sent";
  onStatusUpdate: (messageId: string, status: "sent") => void;
  messageId: string;
}

const ClientCard = ({
  clientId,
  clientName,
  clientPhone,
  messageCode,
  messageContent,
  attentionLevel,
  scheduledDate,
  status,
  onStatusUpdate,
  messageId
}: ClientCardProps) => {
  const [currentStatus, setCurrentStatus] = useState(status);

  const getAttentionColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAttentionLabel = (level: string) => {
    switch (level) {
      case "high": return "Alta";
      case "medium": return "Média";
      case "low": return "Baixa";
      default: return "Média";
    }
  };

  const handleMarkAsSent = () => {
    setCurrentStatus("sent");
    onStatusUpdate(messageId, "sent");
    toast.success(`Mensagem marcada como enviada para ${clientName}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">{clientName}</h4>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getAttentionColor(attentionLevel)}`}
                >
                  {getAttentionLabel(attentionLevel)}
                </Badge>
                {currentStatus === "sent" ? (
                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                    <CheckCircle size={12} />
                    Enviada
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 flex items-center gap-1">
                    <Clock size={12} />
                    Pendente
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Message Info */}
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-blue-600">{messageCode}</span>
            </div>
            
            <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
              {messageContent}
            </p>
            
            <div className="text-xs text-gray-500">
              📱 {clientPhone}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <WhatsAppButton 
              phone={clientPhone} 
              size="sm"
              variant="text"
              className="flex-1"
            />
            
            {currentStatus === "pending" && (
              <Button
                size="sm"
                onClick={handleMarkAsSent}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                <CheckCircle size={14} className="mr-1" />
                Marcar como enviada
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
