import React from "react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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
      <PopoverContent className="w-[400px] p-4">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 text-sm">Tipo de Cliente</h4>
            <Select onValueChange={(value) => console.log(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="renewal">Renovação</SelectItem>
                <SelectItem value="return">Retorno</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-sm">Serviço</h4>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os serviços" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
                <SelectItem value="monthly">Plano Mensal</SelectItem>
                <SelectItem value="quarterly">Plano Trimestral</SelectItem>
                <SelectItem value="biannual">Plano Semestral</SelectItem>
                <SelectItem value="annual">Plano Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-sm">Data</h4>
            <div className="flex gap-2">
              <Input type="date" placeholder="De" className="flex-1" />
              <Input type="date" placeholder="Até" className="flex-1" />
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-sm">Status</h4>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
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
