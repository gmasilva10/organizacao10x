import React from 'react';
import { Client } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ClientForm from '../cadastro/ClientForm'; // Importando o formulário unificado

interface EditClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onClientUpdated: () => void;
}

const EditClientDialog = ({
  isOpen,
  onOpenChange,
  client,
  onClientUpdated,
}: EditClientDialogProps) => {

  // Esta função agora será chamada pelo ClientForm quando o processo terminar
  const handleFormClose = () => {
    onClientUpdated(); // 1. Atualiza os dados na página de perfil
    onOpenChange(false); // 2. Fecha o diálogo
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente: {client.name}</DialogTitle>
          <DialogDescription>
            Modifique as informações do cliente abaixo. As alterações são salvas automaticamente.
          </DialogDescription>
        </DialogHeader>
        <ClientForm 
          client={client}
          onClose={handleFormClose} // Passando a função unificada
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog; 