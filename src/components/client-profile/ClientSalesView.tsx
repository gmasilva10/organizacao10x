import React, { useEffect, useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SaleDisplayData {
  id: string;
  startDate: string;
  endDate: string;
  serviceName: string;
  value: number;
  status: string;
}

interface ClientSalesViewProps {
  clientId: string;
}

const getStatusVariant = (status: string | undefined | null) => {
  switch (status) {
    case 'active':
      return 'default';
    case 'expired':
      return 'destructive';
    case 'canceled':
      return 'outline';
    case 'pending':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getStatusLabel = (status: string | undefined | null) => {
  switch (status) {
    case 'active':
      return 'Ativo';
    case 'expired':
      return 'Expirado';
    case 'canceled':
      return 'Cancelado';
    case 'pending':
      return 'Pendente';
    default:
      return 'N/A';
  }
};

const ClientSalesView = ({ clientId }: ClientSalesViewProps) => {
  const [sales, setSales] = useState<SaleDisplayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientSales = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data: clientServicesData, error: supabaseError } = await supabase
          .from('client_services')
          .select(`
            client_service_id, 
            client_service_start_date, 
            client_service_end_date, 
            client_service_value, 
            client_service_status,
            service_catalog (
              name
            )
          `)
          .eq('client_id', clientId)
          .order('client_service_start_date', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        if (clientServicesData) {
          const formattedSales: SaleDisplayData[] = clientServicesData.map((cs: any) => ({
            id: cs.client_service_id,
            startDate: cs.client_service_start_date,
            endDate: cs.client_service_end_date,
            serviceName: cs.service_catalog?.name || "Serviço não especificado",
            value: cs.client_service_value,
            status: cs.client_service_status
          }));
          setSales(formattedSales);
        } else {
          setSales([]);
        }
      } catch (err: any) {
        console.error("Erro ao buscar histórico de compras:", err);
        setError(err.message || "Falha ao carregar histórico de compras.");
        toast.error("Erro ao carregar histórico de compras", { description: err.message });
        setSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClientSales();
  }, [clientId]);

  if (loading) {
    return <div className="p-6 text-center">Carregando histórico de compras...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Erro: {error}</div>;
  }

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
              <TableHead className="w-[120px]">Data Início</TableHead>
              <TableHead className="w-[120px]">Data Término</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead className="w-[120px]">Valor</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-gray-500 font-medium">Nenhuma compra registrada para este cliente</p>
                </TableCell>
              </TableRow>
            ) : (
              sales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.startDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</TableCell>
                  <TableCell>{new Date(sale.endDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</TableCell>
                  <TableCell>{sale.serviceName}</TableCell>
                  <TableCell>R$ {sale.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(sale.status)}>
                      {getStatusLabel(sale.status)}
                    </Badge>
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
