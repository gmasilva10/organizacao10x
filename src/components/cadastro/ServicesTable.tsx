import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ServiceForm from "./ServiceForm";
import { toast } from "sonner";
import { useRealServices } from "@/hooks/useRealServices";
import DataTransition from "@/components/common/DataTransition";

const ServicesTable = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  
  const { services, loading, error, refetch, deleteService } = useRealServices();

  const handleEdit = (service: any) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleDelete = (service: any) => {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete?.service_id) {
      toast.error("Erro Crítico", { description: "Não foi possível identificar o serviço para exclusão."});
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      await deleteService(serviceToDelete.service_id);
      toast.success(`Serviço "${serviceToDelete.name}" excluído com sucesso.`);
    } catch (error: any) {
      toast.error('Erro ao excluir serviço', {
        description: error.message || "Ocorreu um erro inesperado."
      });
    }
    setIsDeleteDialogOpen(false);
    setServiceToDelete(null);
  };

  const handleServiceSaved = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    refetch();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDuration = (days: number | null | undefined) => {
    if (days === null || days === undefined || isNaN(days) || days <= 0) {
      return 'N/A';
    }
    if (days === 1) return '1 dia';

    // Conversão para anos
    if (days % 365 === 0) {
      const years = days / 365;
      return years === 1 ? '1 ano' : `${years} anos`;
    }
    
    // Conversão para meses (aproximado)
    if (days % 30 === 0) {
      const months = days / 30;
      return months === 1 ? '1 mês' : `${months} meses`;
    }

    // Padrão para dias
    return `${days} dias`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Serviços</h2>
        <Button 
          size="sm" 
          className="flex items-center gap-1" 
          onClick={() => {
            setEditingService(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus size={16} />
          Novo Serviço
        </Button>
      </div>

      <DataTransition loading={loading} error={error}>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.service_id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell>{formatCurrency(service.price)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(service)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(service)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DataTransition>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          <ServiceForm 
            onClose={handleServiceSaved}
            service={editingService}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <div className="py-4">
            <p>
              Tem certeza que deseja excluir o serviço "{serviceToDelete?.name}"?
              Esta ação não poderá ser desfeita.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesTable;
