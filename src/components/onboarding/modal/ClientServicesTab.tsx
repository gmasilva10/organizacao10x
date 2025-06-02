
import React from "react";
import { Client, Service, Campaign } from "@/types";

interface ClientServicesTabProps {
  client: Client;
  service?: Service;
  campaign?: Campaign;
}

const ClientServicesTab = ({ client, service, campaign }: ClientServicesTabProps) => {
  return (
    <div className="mt-4">
      <div className="p-4 border rounded-md mb-4">
        <h3 className="font-medium mb-2">Serviço Atual</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Serviço</div>
            <div className="font-medium">{service?.name || "Não informado"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Campanha</div>
            <div className="font-medium">{campaign?.name || "Não informado"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Duração</div>
            <div className="font-medium">{service?.duration || 0} meses</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Data de Início</div>
            <div className="font-medium">{new Date(client.startDate).toLocaleDateString("pt-BR")}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Data de Término</div>
            <div className="font-medium">{new Date(client.endDate).toLocaleDateString("pt-BR")}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Valor</div>
            <div className="font-medium">
              {service ? service.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
            </div>
          </div>
        </div>
      </div>
      
      <h3 className="font-medium mb-2">Histórico de Serviços</h3>
      <div className="text-gray-500 text-center py-8">
        Nenhum histórico de serviços anteriores.
      </div>
    </div>
  );
};

export default ClientServicesTab;
