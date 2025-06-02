
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { clients } from "@/services/mockData";

interface ClientSalesViewProps {
  clientId: string;
}

const ClientSalesView = ({ clientId }: ClientSalesViewProps) => {
  const client = clients.find(c => c.id === clientId);
  
  // Mock sales data with multiple purchases - in real app would come from client_services table
  const salesData = [
    {
      id: "1",
      startDate: new Date(client?.startDate || Date.now()).toISOString(),
      endDate: new Date(client?.endDate || Date.now()).toISOString(),
      serviceName: (() => {
        switch(client?.serviceType) {
          case "monthly": return "Plano Mensal";
          case "quarterly": return "Plano Trimestral";
          case "biannual": return "Plano Semestral";
          case "annual": return "Plano Anual";
          default: return "Serviço não especificado";
        }
      })(),
      value: client?.value || 0,
      status: client?.status === "active" ? "Ativo" : "Inativo"
    },
    {
      id: "2",
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
      serviceName: "Plano Mensal",
      value: 197.00,
      status: "Finalizado"
    },
    {
      id: "3",
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() - 9)).toISOString(),
      serviceName: "Plano Trimestral",
      value: 497.00,
      status: "Finalizado"
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Histórico de Compras</h3>
        <Button size="sm" className="flex items-center gap-1">
          <Plus size={16} />
          Registrar Nova Compra
        </Button>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[120px]">Data Início</TableHead>
              <TableHead className="w-[120px]">Data Término</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead className="w-[120px]">Valor</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-gray-500 font-medium">Nenhuma compra registrada</p>
                </TableCell>
              </TableRow>
            ) : (
              salesData.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>{new Date(sale.startDate).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{new Date(sale.endDate).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{sale.serviceName}</TableCell>
                  <TableCell>R$ {sale.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs ${
                        sale.status === "Ativo" ? "bg-green-100 text-green-700" : 
                        sale.status === "Finalizado" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {sale.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientSalesView;
