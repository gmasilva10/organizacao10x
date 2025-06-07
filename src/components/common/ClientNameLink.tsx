import React from "react";
import { useNavigate } from "react-router-dom";
import { AttentionLevel } from "@/types";
import { cn } from "@/lib/utils";

interface ClientNameLinkProps {
  clientId: string;
  clientName: string;
  attentionLevel: AttentionLevel;
  className?: string;
}

const ClientNameLink = ({ clientId, clientName, attentionLevel, className }: ClientNameLinkProps) => {
  const navigate = useNavigate();

  const getAttentionLevelColor = (level: AttentionLevel) => {
    switch(level) {
      case "high": 
        return "bg-attention-high";
      case "medium":
        return "bg-attention-medium";
      case "low": 
        return "bg-attention-low";
      default: 
        return "bg-gray-400";
    }
  };

  const getAttentionLevelLabel = (level: AttentionLevel) => {
    switch(level) {
      case "high": 
        return "Alta atenção";
      case "medium":
        return "Média atenção";
      case "low": 
        return "Baixa atenção";
      default: 
        return "Sem classificação";
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/cliente/${clientId}`);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn("w-3 h-3 rounded-sm", getAttentionLevelColor(attentionLevel))} 
        title={getAttentionLevelLabel(attentionLevel)}
      />
      <button 
        className="text-blue-600 hover:underline text-left font-medium"
        onClick={handleClick}
      >
        {clientName}
      </button>
    </div>
  );
};

export default ClientNameLink;
