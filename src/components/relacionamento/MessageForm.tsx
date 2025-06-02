
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MessageTemplate, useRealMessageTemplates } from "@/hooks/useRealMessageTemplates";

interface MessageFormProps {
  template?: MessageTemplate | null;
  onClose: () => void;
}

const MessageForm = ({ template, onClose }: MessageFormProps) => {
  const { createTemplate, updateTemplate } = useRealMessageTemplates();
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      code: template?.code || '',
      content: template?.content || '',
      description: template?.description || '',
      dayOffset: template?.dayOffset || 0,
      objective: template?.objective || '',
      category: template?.category || ''
    }
  });

  const onSubmit = async (data: any) => {
    try {
      if (template) {
        await updateTemplate(template.id, data);
        toast.success("Mensagem atualizada com sucesso!");
      } else {
        await createTemplate(data);
        toast.success("Mensagem criada com sucesso!");
      }
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar mensagem");
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            {...register('code', { required: true })}
            placeholder="Ex: MSG001"
          />
        </div>
        
        <div>
          <Label htmlFor="dayOffset">Dias após marco</Label>
          <Input
            id="dayOffset"
            type="number"
            {...register('dayOffset', { required: true, valueAsNumber: true })}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          {...register('description', { required: true })}
          placeholder="Descrição da mensagem"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select 
            value={watch('category')} 
            onValueChange={(value) => setValue('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boas-vindas">Boas-vindas</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="renovação">Renovação</SelectItem>
              <SelectItem value="nutrição">Nutrição</SelectItem>
              <SelectItem value="treino">Treino</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="objective">Objetivo</Label>
          <Select 
            value={watch('objective')} 
            onValueChange={(value) => setValue('objective', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um objetivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="engajamento">Engajamento</SelectItem>
              <SelectItem value="retenção">Retenção</SelectItem>
              <SelectItem value="conversão">Conversão</SelectItem>
              <SelectItem value="suporte">Suporte</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="content">Conteúdo da Mensagem</Label>
        <Textarea
          id="content"
          {...register('content', { required: true })}
          placeholder="Digite o conteúdo da mensagem..."
          rows={6}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {template ? "Atualizar" : "Criar"} Mensagem
        </Button>
      </div>
    </form>
  );
};

export default MessageForm;
