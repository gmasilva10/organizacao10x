
import React from "react";
import { Badge } from "@/components/ui/badge";

interface CardStatusBadgesProps {
  isActive: boolean | undefined;
  serviceType: string;
}

const CardStatusBadges = ({ isActive, serviceType }: CardStatusBadgesProps) => {
  const getStatusBadgeColor = (isActive: boolean | undefined) => {
    return isActive 
      ? "bg-green-500 hover:bg-green-600 text-white" 
      : "bg-red-500 hover:bg-red-600 text-white";
  };

  const getServiceBadgeColor = (service: string) => {
    // Map services to colors (can be expanded)
    const serviceColors: Record<string, string> = {
      "Mensal": "bg-blue-100 text-blue-800",
      "Trimestral": "bg-green-100 text-green-800",
      "Semestral": "bg-purple-100 text-purple-800",
      "Anual": "bg-indigo-100 text-indigo-800",
    };
    
    return serviceColors[service] || "bg-gray-100 text-gray-800";
  };

  const status = isActive ? "Ativo" : "Inativo";

  return (
    <div className="flex items-center gap-2 mt-2">
      <Badge className={getStatusBadgeColor(isActive)}>
        {status}
      </Badge>
      <Badge className={getServiceBadgeColor(serviceType)}>
        {serviceType}
      </Badge>
    </div>
  );
};

export default CardStatusBadges;
