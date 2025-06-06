import React from "react";
import { Client } from "@/types";
import { 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Activity, 
  FileText 
} from "lucide-react";

interface ClientGeneralViewProps {
  client: Client;
}

const ClientGeneralView = ({ client }: ClientGeneralViewProps) => {
  const getAttentionLevelLabel = (level: string | undefined | null) => {
    const lowerLevel = String(level).toLowerCase();
    switch(lowerLevel) {
      case "alto":
      case "high": 
        return "Alta";
      case "médio":
      case "medium":
        return "Média";
      case "baixo":
      case "low": 
        return "Baixa";
      default: 
        console.log("[ClientGeneralView] Nível de atenção não reconhecido ou indefinido:", level, "(lowerLevel:", lowerLevel, ")");
        return "Não definido";
    }
  };

  const getAttentionLevelColor = (level: string | undefined | null) => {
    const lowerLevel = String(level).toLowerCase();
    switch(lowerLevel) {
      case "alto":
      case "high": 
        return "bg-attention-high";
      case "médio":
      case "medium":
        return "bg-attention-medium";
      case "baixo":
      case "low": 
        return "bg-attention-low";
      default: 
        return "bg-gray-200";
    }
  };

  // Get latest purchase (mock data - in real app would come from client_services table)
  const getLatestPurchase = () => {
    // Mock data for latest purchase
    return {
      serviceName: (() => {
        switch(client.serviceType) {
          case "monthly": return "Plano Mensal";
          case "quarterly": return "Plano Trimestral";
          case "biannual": return "Plano Semestral";
          case "annual": return "Plano Anual";
          default: return "Não especificado";
        }
      })(),
      value: client.value || 0,
      startDate: client.startDate,
      endDate: client.endDate,
      status: client.status === "active" ? "Ativo" : "Inativo"
    };
  };

  const latestPurchase = getLatestPurchase();

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Informações Pessoais</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail size={18} className="mt-1 text-gray-500" />
              <div>
                <div className="font-medium">Email</div>
                <div className="text-gray-600">{client.email}</div>
              </div>
            </div>
              
            <div className="flex items-start gap-3">
              <Phone size={18} className="mt-1 text-gray-500" />
              <div>
                <div className="font-medium">Telefone</div>
                <div className="text-gray-600">{client.phone}</div>
              </div>
            </div>
              
            <div className="flex items-start gap-3">
              <FileText size={18} className="mt-1 text-gray-500" />
              <div>
                <div className="font-medium">CPF</div>
                <div className="text-gray-600">{client.cpf || "Não informado"}</div>
              </div>
            </div>
              
            <div className="flex items-start gap-3">
              <Calendar size={18} className="mt-1 text-gray-500" />
              <div>
                <div className="font-medium">Data de Nascimento</div>
                <div className="text-gray-600">
                  {client.birthDate ? new Date(client.birthDate).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Não informado"}
                </div>
              </div>
            </div>
              
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-1 text-gray-500" />
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
              <Activity size={18} className="mt-1 text-gray-500" />
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
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Última Compra</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-md">
              <div className="text-sm text-gray-600">Serviço</div>
              <div className="font-medium text-lg">{latestPurchase.serviceName}</div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-md">
              <div className="text-sm text-gray-600">Valor</div>
              <div className="font-medium text-lg">R$ {latestPurchase.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-md">
              <div className="text-sm text-gray-600">Período</div>
              <div className="font-medium text-lg">
                {new Date(latestPurchase.startDate).toLocaleDateString("pt-BR")} até {new Date(latestPurchase.endDate).toLocaleDateString("pt-BR")}
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-md">
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-medium text-lg">{latestPurchase.status}</div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Observações</h3>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-gray-700">
                {client.notes || "Nenhuma observação registrada."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientGeneralView;
