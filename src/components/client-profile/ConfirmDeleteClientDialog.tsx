import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button"; // Para o botão de ação destrutivo

interface ConfirmDeleteClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
  clientName: string;
  isDeleting: boolean;
}

const ConfirmDeleteClientDialog = ({
  isOpen,
  onOpenChange,
  onConfirmDelete,
  clientName,
  isDeleting,
}: ConfirmDeleteClientDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza de que deseja excluir o cliente "{clientName}"? Esta
            ação não poderá ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive" // Estilo vermelho para o botão de exclusão
            onClick={async () => {
              if (isDeleting) return;
              await onConfirmDelete();
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Excluindo..." : "Excluir Definitivamente"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDeleteClientDialog; 