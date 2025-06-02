
import React from "react";
import { AttentionLevel } from "@/types";

interface StatusBadgeProps {
  attentionLevel: AttentionLevel;
  status: "active" | "inactive";
}

const StatusBadge = ({ attentionLevel, status }: StatusBadgeProps) => {
  const getAttentionLevelColor = (level: "high" | "medium" | "low") => {
    switch(level) {
      case "high": return "bg-attention-high";
      case "medium": return "bg-attention-medium";
      case "low": return "bg-attention-low";
    }
  };

  const getAttentionLevelLabel = (level: "high" | "medium" | "low") => {
    switch(level) {
      case "high": return "Alta";
      case "medium": return "Média";
      case "low": return "Baixa";
    }
  };

  return (
    <>
      <div 
        className={`w-4 h-4 rounded-sm ${getAttentionLevelColor(attentionLevel)}`} 
        title={getAttentionLevelLabel(attentionLevel)} 
      />
      <span 
        className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
        }`}
      >
        {status === "active" ? "Ativo" : "Inativo"}
      </span>
    </>
  );
};

export default StatusBadge;
