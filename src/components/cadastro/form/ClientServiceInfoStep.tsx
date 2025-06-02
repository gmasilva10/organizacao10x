import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRealServices } from "@/hooks/useRealServices";
import StepCard from "./StepCard";

interface ClientServiceInfoStepProps {
  onPrevious: () => void;
  onNext: () => void;
}

const ClientServiceInfoStep = ({ onPrevious, onNext }: ClientServiceInfoStepProps) => {
  const { control, watch, setValue } = useFormContext();
  const selectedServiceId = watch("service");
  const { services, loading: servicesLoading, error: servicesError } = useRealServices();

  useEffect(() => {
    if (selectedServiceId) {
      const service = services.find(s => s.service_id === selectedServiceId);
      if (service) {
        setValue("serviceValue", service.price || 0);
        setValue("serviceDurationMonths", service.duration_months || 0);
      } else {
        setValue("serviceValue", 0);
        setValue("serviceDurationMonths", 0);
      }
    } else {
      setValue("serviceValue", 0);
      setValue("serviceDurationMonths", 0);
    }
  }, [selectedServiceId, services, setValue]);

  if (servicesLoading) {
    return <StepCard title="Informações do Serviço" description="Carregando serviços..."><p>Carregando...</p></StepCard>;
  }

  if (servicesError) {
    return <StepCard title="Informações do Serviço" description="Erro ao carregar serviços"><p className="text-red-500">{servicesError}</p></StepCard>;
  }

  return (
    <StepCard 
      title="Informações do Serviço" 
      description="Configure os detalhes da venda e do atendimento"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="collaborator"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Colaborador</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecione um colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
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
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Tipo de Cliente</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecione o tipo" />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="service"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Serviço contratado</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Escolha uma opção" />
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
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Valor do serviço</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    readOnly 
                    className="bg-gray-50 h-12 text-base"
                    placeholder="R$ 100"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Forma de Pagamento</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Boleto Bancário">Boleto Bancário</SelectItem>
                      <SelectItem value="Transferência Bancária (TED/DOC)">Transferência Bancária</SelectItem>
                      <SelectItem value="Carteiras Digitais">Carteiras Digitais</SelectItem>
                      <SelectItem value="Dinheiro em Espécie">Dinheiro em Espécie</SelectItem>
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
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Parcelas</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-12 text-base">
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

          <FormField
            control={control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Data do Pagamento</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    className="h-12 text-base"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between pt-6">
          <Button 
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="px-8 py-3 text-base font-medium"
            size="lg"
          >
            Voltar
          </Button>
          <Button 
            type="button"
            onClick={onNext}
            className="px-8 py-3 text-base font-medium"
            size="lg"
          >
            Continuar
          </Button>
        </div>
      </div>
    </StepCard>
  );
};

export default ClientServiceInfoStep;
