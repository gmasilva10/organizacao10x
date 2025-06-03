import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/types'; // Assumindo que você tem um tipo Client

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

interface EditClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client; // Cliente atual para pré-preencher
  onClientUpdated: () => void; // Callback após atualização
}

// Definindo um tipo para os dados do formulário de edição
// Baseado nas colunas da tabela 'clients' e nos campos editáveis decididos
type EditClientFormData = {
  client_name: string;
  client_email: string;
  client_phone: string;
  client_birth_date: string; // Formato YYYY-MM-DD
  client_cpf: string; // Será readonly
  client_city: string;
  client_state: string;
  client_attention_level: 'Baixo' | 'Médio' | 'Alto' | string; // String para o valor do RadioGroup
  client_notes: string;
};

const EditClientDialog = ({
  isOpen,
  onOpenChange,
  client,
  onClientUpdated,
}: EditClientDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<EditClientFormData>({
    // Pré-preencher o formulário com os dados do cliente atual
    defaultValues: {
      client_name: client.name || '',
      client_email: client.email || '', // Assumindo que seu tipo Client tem 'email'
      client_phone: client.phone || '', // Assumindo que seu tipo Client tem 'phone'
      client_birth_date: client.birthDate || '', // Assumindo Client.birthDate no formato YYYY-MM-DD
      client_cpf: client.cpf || '', // Assumindo Client.cpf
      client_city: client.city || '', // Assumindo Client.city
      client_state: client.state || '', // Assumindo Client.state
      client_attention_level: client.attentionLevel || 'Médio', // Assumindo Client.attentionLevel
      client_notes: client.notes || '', // Assumindo Client.notes
    },
  });

  useEffect(() => {
    // Resetar o formulário quando o cliente mudar ou o modal abrir/fechar
    // para garantir que os defaultValues mais recentes sejam usados.
    if (client) {
      methods.reset({
        client_name: client.name || '',
        client_email: client.email || '',
        client_phone: client.phone || '',
        client_birth_date: client.birthDate || '',
        client_cpf: client.cpf || '',
        client_city: client.city || '',
        client_state: client.state || '',
        client_attention_level: client.attentionLevel || 'Médio',
        client_notes: client.notes || '',
      });
    }
  }, [client, isOpen, methods]);

  const onSubmit = async (data: EditClientFormData) => {
    setIsSubmitting(true);
    console.log("[EditClientDialog] Submitting data:", data);

    const updateData = {
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone.replace(/\D/g, ''), // Limpar máscara se houver
      client_birth_date: data.client_birth_date || null,
      // CPF não é atualizado pois é readonly
      client_city: data.client_city || null,
      client_state: data.client_state || null,
      client_attention_level: data.client_attention_level,
      client_notes: data.client_notes || null,
      updated_at: new Date().toISOString(), // Atualizar timestamp
    };

    try {
      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('client_id', client.id); // Assumindo que seu tipo Client tem 'id' como client_id

      if (error) {
        throw error;
      }

      toast.success('Cliente atualizado com sucesso!');
      onClientUpdated(); // Para refetch dos dados no perfil
      onOpenChange(false); // Fechar o modal
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error('Falha ao atualizar cliente', {
        description: error.message || 'Não foi possível salvar as alterações. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente: {client.name}</DialogTitle>
          <DialogDescription>
            Modifique as informações do cliente abaixo.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Nome Completo */}
            <FormField
              control={methods.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={methods.control}
              name="client_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Telefone */}
            <FormField
              control={methods.control}
              name="client_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (WhatsApp) *</FormLabel>
                  <FormControl>
                    <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de Nascimento */}
              <FormField
                control={methods.control}
                name="client_birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CPF (Readonly) */}
              <FormField
                control={methods.control}
                name="client_cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF (não editável)</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-gray-100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cidade */}
                <FormField
                control={methods.control}
                name="client_city"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                        <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {/* Estado */}
                <FormField
                control={methods.control}
                name="client_state"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {/* TODO: Adicionar lista de estados brasileiros */}
                            <SelectItem value="SP">São Paulo</SelectItem>
                            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                            <SelectItem value="MG">Minas Gerais</SelectItem>
                            {/* Adicionar outros estados... */}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            {/* Nível de Atenção */}
            <FormField
              control={methods.control}
              name="client_attention_level"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Nível de Atenção</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col sm:flex-row sm:space-x-4 sm:space-y-0 space-y-1"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Alto" />
                        </FormControl>
                        <FormLabel className="font-normal">Alto</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Médio" />
                        </FormControl>
                        <FormLabel className="font-normal">Médio</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Baixo" />
                        </FormControl>
                        <FormLabel className="font-normal">Baixo</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={methods.control}
              name="client_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações sobre o cliente..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog; 