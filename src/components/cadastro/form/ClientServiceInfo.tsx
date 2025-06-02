
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { services } from "@/services/mockData";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ClientServiceInfo = () => {
  const { control, watch, setValue } = useFormContext();
  const selectedService = watch("service");

  // When service changes, update service value automatically
  useEffect(() => {
    if (selectedService) {
      const service = services.find(s => s.id === selectedService);
      if (service) {
        setValue("serviceValue", service.price);
      }
    }
  }, [selectedService, setValue]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="collaborator"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="collaborator">Colaborador</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="collaborator">
                    <SelectValue placeholder="Selecione um colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    {/* TODO: Load collaborators from database */}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="clientType"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="clientType">Tipo de Cliente</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="clientType">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEAD">LEAD</SelectItem>
                    <SelectItem value="Renovação">Renovação</SelectItem>
                    <SelectItem value="Retorno">Retorno</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="service"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="service">Serviço</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="serviceValue"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="serviceValue">Valor do Serviço (R$)</FormLabel>
              <FormControl>
                <Input 
                  id="serviceValue" 
                  type="number" 
                  readOnly 
                  className="bg-gray-50"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="paymentMethod">Forma de Pagamento</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Boleto Bancário">Boleto Bancário</SelectItem>
                    <SelectItem value="Transferência Bancária (TED/DOC)">Transferência Bancária (TED/DOC)</SelectItem>
                    <SelectItem value="Carteiras Digitais">Carteiras Digitais</SelectItem>
                    <SelectItem value="Dinheiro em Espécie">Dinheiro em Espécie</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="installments"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="installments">Parcelas</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="installments">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i + 1} value={`${i + 1}x`}>
                        {`${i + 1}x`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="paymentDate"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor="paymentDate">Data do Pagamento</FormLabel>
            <FormControl>
              <Input id="paymentDate" type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="attentionLevel"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Nível de Atenção</FormLabel>
            <FormControl>
              <RadioGroup 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                className="flex space-x-4"
              >
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="high" id="attention-high" />
                  </FormControl>
                  <FormLabel className="flex items-center" htmlFor="attention-high">
                    <div className="h-4 w-4 bg-red-500 rounded-sm mr-2" />
                    <span>Alto</span>
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="medium" id="attention-medium" />
                  </FormControl>
                  <FormLabel className="flex items-center" htmlFor="attention-medium">
                    <div className="h-4 w-4 bg-yellow-500 rounded-sm mr-2" />
                    <span>Médio</span>
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="low" id="attention-low" />
                  </FormControl>
                  <FormLabel className="flex items-center" htmlFor="attention-low">
                    <div className="h-4 w-4 bg-green-500 rounded-sm mr-2" />
                    <span>Baixo</span>
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="observation"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor="observation">Observações</FormLabel>
            <FormControl>
              <Textarea
                id="observation"
                placeholder="Observações relacionadas ao aluno para consultoria online..."
                className="w-full resize-none"
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ClientServiceInfo;
