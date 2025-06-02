
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AttentionLevel } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: string;
  onAddCard: (columnId: string, clientName: string, content: string, attentionLevel: AttentionLevel) => void;
}

const AddCardDialog: React.FC<AddCardDialogProps> = ({ isOpen, onClose, columnId, onAddCard }) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [service, setService] = useState('Plano Completo');
  const [attentionLevel, setAttentionLevel] = useState<AttentionLevel>('medium');

  const handleSubmit = () => {
    if (!clientName.trim()) return;
    // Combine status and service into content
    const content = `${status}, ${service}`;
    onAddCard(columnId, clientName, content, attentionLevel);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setClientName('');
    setClientEmail('');
    setStatus('Ativo');
    setService('Plano Completo');
    setAttentionLevel('medium');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Adicionar Novo Aluno</DialogTitle>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-2">
            <Label htmlFor="clientName">
              Nome do Aluno*
            </Label>
            <Input
              id="clientName"
              type="text"
              placeholder="Nome completo"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientEmail">
              E-mail
            </Label>
            <Input
              id="clientEmail"
              type="email"
              placeholder="email@exemplo.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em análise">Em análise</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service">
                Serviço
              </Label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger id="service">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Plano Completo">Plano Completo</SelectItem>
                  <SelectItem value="Treino">Treino</SelectItem>
                  <SelectItem value="Dieta">Dieta</SelectItem>
                  <SelectItem value="Consultoria">Consultoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="attentionLevel">
              Nível de Atenção
            </Label>
            <Select value={attentionLevel} onValueChange={(value) => setAttentionLevel(value as AttentionLevel)}>
              <SelectTrigger id="attentionLevel">
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixo</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCardDialog;
