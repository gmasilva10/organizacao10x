
import React from "react";
import { Client } from "@/types";
import { Phone, Mail, Calendar, MapPin, Activity } from "lucide-react";

interface ClientInfoTabProps {
  client: Client;
}

const ClientInfoTab = ({ client }: ClientInfoTabProps) => {
  const getAttentionLevelLabel = (level: "high" | "medium" | "low") => {
    switch(level) {
      case "high": return "Alta";
      case "medium": return "Média";
      case "low": return "Baixa";
    }
  };

  const getAttentionLevelColor = (level: "high" | "medium" | "low") => {
    switch(level) {
      case "high": return "bg-attention-high";
      case "medium": return "bg-attention-medium";
      case "low": return "bg-attention-low";
    }
  };
  
  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <Phone size={16} className="mt-1" />
          <div>
            <div className="font-medium">Telefone</div>
            <div className="text-gray-600">{client.phone}</div>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Mail size={16} className="mt-1" />
          <div>
            <div className="font-medium">Email</div>
            <div className="text-gray-600">{client.email}</div>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Calendar size={16} className="mt-1" />
          <div>
            <div className="font-medium">Data de Nascimento</div>
            <div className="text-gray-600">
              {client.birthDate ? new Date(client.birthDate).toLocaleDateString("pt-BR") : "Não informado"}
            </div>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <MapPin size={16} className="mt-1" />
          <div>
            <div className="font-medium">Localização</div>
            <div className="text-gray-600">
              {client.city && client.state
                ? `${client.city}, ${client.state}, ${client.country}`
                : client.country || "Não informado"}
            </div>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Activity size={16} className="mt-1" />
          <div>
            <div className="font-medium">Nível de Atenção</div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${getAttentionLevelColor(client.attentionLevel)}`} />
              <span className="text-gray-600">
                {getAttentionLevelLabel(client.attentionLevel)}
              </span>
            </div>
          </div>
        </div>
        
        {client.cpf && (
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 flex items-center justify-center mt-1">
              <span className="text-xs font-bold">ID</span>
            </div>
            <div>
              <div className="font-medium">CPF</div>
              <div className="text-gray-600">{client.cpf}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientInfoTab;
