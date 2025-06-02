
import React from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StepCard from "./form/StepCard";

interface ClientDetailsStepProps {
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const ClientDetailsStep = ({ onPrevious, onSubmit, isSubmitting }: ClientDetailsStepProps) => {
  const { control } = useFormContext();

  return (
    <StepCard 
      title="Informações Adicionais" 
      description="Configure o nível de atenção, data M0 e observações"
    >
      <div className="space-y-4">
        <FormField
          control={control}
          name="attentionLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Nível de Atenção</FormLabel>
              <FormControl>
                <RadioGroup 
                  onValueChange={field.onChange} 
                  defaultValue={field.value} 
                  className="flex space-x-4 pt-2"
                >
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="high" />
                    </FormControl>
                    <FormLabel className="flex items-center font-normal cursor-pointer">
                      <div className="h-3 w-3 bg-red-500 rounded-sm mr-2" />
                      <span>Alto</span>
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="medium" />
                    </FormControl>
                    <FormLabel className="flex items-center font-normal cursor-pointer">
                      <div className="h-3 w-3 bg-yellow-500 rounded-sm mr-2" />
                      <span>Médio</span>
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="low" />
                    </FormControl>
                    <FormLabel className="flex items-center font-normal cursor-pointer">
                      <div className="h-3 w-3 bg-green-500 rounded-sm mr-2" />
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
          name="m0Type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Qual a data considerada como M0?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de M0" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="payment_date">Data de Pagamento</SelectItem>
                  <SelectItem value="anamnesis_delivery">Entrega da Anamnese</SelectItem>
                  <SelectItem value="training_delivery">Entrega do Treino</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="observation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações relacionadas ao aluno para consultoria online..."
                  className="resize-none min-h-[80px] text-sm"
                  {...field}
                />
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
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-6 py-2"
          >
            {isSubmitting ? 'Salvando...' : 'Finalizar Cadastro'}
          </Button>
        </div>
      </div>
    </StepCard>
  );
};

export default ClientDetailsStep;
