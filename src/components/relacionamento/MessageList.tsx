
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import MessageForm from "./MessageForm";
import MessageCard from "./MessageCard";
import { MessageTemplate } from "@/hooks/useRealMessageTemplates";

interface MessageListProps {
  templates: MessageTemplate[];
}

const MessageList = ({ templates }: MessageListProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleAddMessage = () => {
    setEditingTemplate(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Modelos de Mensagens</h2>
        <Button 
          size="sm" 
          className="flex items-center gap-1" 
          onClick={handleAddMessage}
        >
          <Plus size={16} />
          Nova Mensagem
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <MessageCard 
            key={template.id}
            template={template}
            onEdit={() => handleEdit(template)}
          />
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum modelo de mensagem encontrado.
          <br />
          Clique em "Nova Mensagem" para criar o primeiro.
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>
            {editingTemplate ? "Editar Mensagem" : "Nova Mensagem"}
          </DialogTitle>
          <MessageForm 
            template={editingTemplate}
            onClose={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageList;
