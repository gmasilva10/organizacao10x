
import React from "react";
import { Client } from "@/types";

interface ClientProgressTabProps {
  client: Client;
}

const ClientProgressTab = ({ client }: ClientProgressTabProps) => {
  return (
    <div className="mt-4">
      <div className="space-y-4">
        <h3 className="font-medium mb-2">Etapas do Onboarding</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
            <input type="checkbox" className="h-4 w-4" checked readOnly />
            <span>Boas-vindas</span>
            <span className="text-xs text-gray-500 ml-auto">
              {new Date(client.startDate).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
            <input type="checkbox" className="h-4 w-4" checked readOnly />
            <span>Avaliação Inicial</span>
            <span className="text-xs text-gray-500 ml-auto">
              {new Date(new Date(client.startDate).getTime() + 86400000 * 2).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
            <input type="checkbox" className="h-4 w-4" checked readOnly />
            <span>Entrega do Treino</span>
            <span className="text-xs text-gray-500 ml-auto">
              {new Date(new Date(client.startDate).getTime() + 86400000 * 4).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
            <input type="checkbox" className="h-4 w-4" />
            <span>Primeiro Follow-up</span>
            <span className="text-xs text-gray-500 ml-auto">Pendente</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
            <input type="checkbox" className="h-4 w-4" />
            <span>Avaliação de Resultados</span>
            <span className="text-xs text-gray-500 ml-auto">Pendente</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProgressTab;
