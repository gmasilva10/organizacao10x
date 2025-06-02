
import React from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StepCard from "./form/StepCard";
import { useRealServices } from "@/hooks/useRealServices";

interface ClientServiceInfoStepProps {
  onPrevious: () => void;
  onNext: () => void;
}

const ClientServiceInfoStep = ({ onPrevious, onNext }: ClientServiceInfoStepProps) => {
  const { control, watch } = useFormContext();
  const { services, loading, error } = useRealServices();

  if (loading) {
    return (
      <StepCard title="Carregando..." description="Buscando serviços disponíveis...">
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </StepCard>
    );
  }

  if (error) {
    return (
      <StepCard title="Erro" description="Não foi possível carregar os serviços">
        <div className="h-32 flex items-center justify-center text-red-500">
          Erro ao carregar serviços. Tente novamente mais tarde.
        </div>
      </StepCard>
    );
  }

  if (services.length === 0) {
    return (
      <StepCard title="Aviso" description="Não é possível cadastrar clientes sem serviços">
        <div className="h-32 flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-orange-600">
            É necessário cadastrar pelo menos um serviço antes de adicionar clientes.
          </p>
          <p className="text-sm text-gray-600">
            Vá até a aba "Serviços" e cadastre os planos disponíveis.
          </p>
        </div>
      </StepCard>
    );
  }

  const handleNext = () => {
    const selectedService = watch("service");
    if (!selectedService) {
      toast.error("Por favor, selecione um serviço");
      return;
    }
    onNext();
  };

  return (
    <StepCard 
      title="Informações do Serviço" 
      description="Configure o plano e os detalhes do serviço"
    >
      <div className="space-y-4">
        <FormField
          control={control}
          name="service"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Plano</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Forma de Pagamento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                </SelectContent>
              </Select>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o número de parcelas" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1x">1x sem juros</SelectItem>
                  <SelectItem value="2x">2x sem juros</SelectItem>
                  <SelectItem value="3x">3x sem juros</SelectItem>
                  <SelectItem value="4x">4x sem juros</SelectItem>
                  <SelectItem value="5x">5x sem juros</SelectItem>
                  <SelectItem value="6x">6x sem juros</SelectItem>
                  <SelectItem value="7x">7x sem juros</SelectItem>
                  <SelectItem value="8x">8x sem juros</SelectItem>
                  <SelectItem value="9x">9x sem juros</SelectItem>
                  <SelectItem value="10x">10x sem juros</SelectItem>
                  <SelectItem value="11x">11x sem juros</SelectItem>
                  <SelectItem value="12x">12x sem juros</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Data de Pagamento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between pt-4">
          <Button 
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="px-6 py-2"
          >
            Voltar
          </Button>
          <Button 
            type="button"
            onClick={handleNext}
            className="px-6 py-2"
          >
            Próximo
          </Button>
        </div>
      </div>
    </StepCard>
  );
};

export default ClientServiceInfoStep;
