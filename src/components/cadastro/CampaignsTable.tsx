
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
import CampaignForm from "./CampaignForm";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRealCampaigns } from "@/hooks/useRealCampaigns";
import DataTransition from "@/components/common/DataTransition";

const CampaignsTable = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  
  const { campaigns, loading, error, refetch } = useRealCampaigns();

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setIsDialogOpen(true);
  };

  const handleDelete = (campaign: any) => {
    setCampaignToDelete(campaign);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    toast.success(`Campanha "${campaignToDelete.name}" excluída com sucesso.`);
    setIsDeleteDialogOpen(false);
    setCampaignToDelete(null);
  };

  const handleCampaignSaved = () => {
    setIsDialogOpen(false);
    setEditingCampaign(null);
    refetch();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Campanhas</h2>
        <Button 
          size="sm" 
          className="flex items-center gap-1" 
          onClick={() => {
            setEditingCampaign(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus size={16} />
          Nova Campanha
        </Button>
      </div>

      <DataTransition loading={loading} error={error}>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Fim</TableHead>
                <TableHead>Conversões</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.description}</TableCell>
                  <TableCell>
                    <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                      {campaign.status === "active" ? "Ativa" : "Concluída"}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  <TableCell>{campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  <TableCell>{campaign.conversions || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(campaign)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(campaign)}
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
          <DialogTitle>{editingCampaign ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
          <CampaignForm 
            onClose={handleCampaignSaved}
            campaign={editingCampaign}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <div className="py-4">
            <p>
              Tem certeza que deseja excluir a campanha "{campaignToDelete?.name}"?
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

export default CampaignsTable;
