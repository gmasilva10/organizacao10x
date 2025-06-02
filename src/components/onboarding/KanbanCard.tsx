
import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ClientDetailModal from "./ClientDetailModal";
import CardMenu from "./CardMenu";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { KanbanCard as KanbanCardType } from "@/types";

interface KanbanCardProps {
  card: KanbanCardType;
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: (columnId: string) => void;
  onUpdate?: () => void;
  isDragging?: boolean;
  columnColor?: string;
  columnId?: string;
}

const KanbanCard = ({ card, onEdit, onDelete, onMove, onUpdate, isDragging, columnId }: KanbanCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatServiceType = (serviceType?: string) => {
    switch (serviceType) {
      case "monthly": return "Mensal";
      case "quarterly": return "Trimestral";
      case "biannual": return "Semestral";
      case "annual": return "Anual";
      default: return serviceType || "N/A";
    }
  };

  const handleViewProfile = () => {
    setIsModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleClientNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const getAttentionLevelColor = (level: string) => {
    switch(level) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <>
      <div className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer relative ${isDragging ? 'opacity-50' : ''}`}>
        {/* Attention level indicator on the left */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${getAttentionLevelColor(card.attentionLevel)}`} />
        
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-1">
            <button 
              className="text-blue-600 hover:underline text-left font-medium flex-1 hover:bg-blue-50 p-1 rounded transition-colors"
              onClick={handleClientNameClick}
              title="Clique para ver o histórico completo"
            >
              {card.clientName}
            </button>
            {card.phone && (
              <WhatsAppButton phone={card.phone} size="sm" />
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="h-6 w-6 p-0 ml-2"
          >
            <MoreVertical size={14} />
          </Button>
          {isMenuOpen && (
            <CardMenu
              clientId={card.clientId}
              card={card}
              columnId={columnId}
              onUpdate={onUpdate}
              onClose={() => setIsMenuOpen(false)}
              onViewProfile={handleViewProfile}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {card.isActive ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Ativo
            </Badge>
          ) : (
            <Badge variant="destructive">
              Inativo
            </Badge>
          )}
          
          {card.serviceType && (
            <Badge variant="outline">
              {formatServiceType(card.serviceType)}
            </Badge>
          )}
        </div>

        {/* Show content if available */}
        {card.content && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {card.content}
          </p>
        )}
      </div>

      <ClientDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientId={card.clientId}
      />
    </>
  );
};

export default KanbanCard;
