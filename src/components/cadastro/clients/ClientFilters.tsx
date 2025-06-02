
import React from "react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

interface ClientFiltersProps {
  serviceFilter: string;
  setServiceFilter: (value: string) => void;
  statusFilter: "all" | "active" | "inactive";
  setStatusFilter: (value: "all" | "active" | "inactive") => void;
}

const ClientFilters = ({
  serviceFilter,
  setServiceFilter,
  statusFilter,
  setStatusFilter
}: ClientFiltersProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <SlidersHorizontal size={16} />
          Filtros
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-4">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 text-sm">Tipo de Cliente</h4>
            <select 
              className="w-full border border-gray-200 rounded-md p-2 text-sm"
              onChange={(e) => console.log(e.target.value)}
            >
              <option value="all">Todos os tipos</option>
              <option value="lead">Lead</option>
              <option value="renewal">Renovação</option>
              <option value="return">Retorno</option>
            </select>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-sm">Serviço</h4>
            <select 
              className="w-full border border-gray-200 rounded-md p-2 text-sm"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <option value="all">Todos os serviços</option>
              <option value="monthly">Plano Mensal</option>
              <option value="quarterly">Plano Trimestral</option>
              <option value="biannual">Plano Semestral</option>
              <option value="annual">Plano Anual</option>
            </select>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-sm">Data</h4>
            <div className="flex gap-2">
              <input 
                type="date" 
                className="flex-1 border border-gray-200 rounded-md p-2 text-sm" 
                placeholder="De"
              />
              <input 
                type="date" 
                className="flex-1 border border-gray-200 rounded-md p-2 text-sm" 
                placeholder="Até"
              />
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-sm">Status</h4>
            <select 
              className="w-full border border-gray-200 rounded-md p-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            >
              <option value="all">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
          
          <div className="pt-2 flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setStatusFilter("all");
                setServiceFilter("all");
              }}
            >
              Limpar filtros
            </Button>
            <Button size="sm">Aplicar</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ClientFilters;
