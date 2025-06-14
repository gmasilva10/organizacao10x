import React from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import StepCard from "./StepCard";

interface ClientDetailsStepProps {
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
}

const ClientDetailsStep = ({ onPrevious, onSubmit, isSubmitting, mode, onClose }: ClientDetailsStepProps) => {
  const { control } = useFormContext();

  return (
    <StepCard 
      title="Observações Adicionais" 
      description="Configure o nível de atenção e adicione observações"
    >
      <div className="space-y-6">
        {mode === 'edit' && (
            <FormField
              control={control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Status do Cliente</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      className="flex space-x-6 pt-2"
                    >
                      <FormItem className="flex items-center space-x-3">
                        <FormControl>
                          <RadioGroupItem value="active" />
                        </FormControl>
                        <FormLabel className="flex items-center font-normal cursor-pointer">
                           <div className="h-4 w-4 bg-green-500 rounded-sm mr-2" />
                           <span>Ativo</span>
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3">
                        <FormControl>
                          <RadioGroupItem value="inactive" />
                        </FormControl>
                        <FormLabel className="flex items-center font-normal cursor-pointer">
                           <div className="h-4 w-4 bg-red-500 rounded-sm mr-2" />
                           <span>Inativo</span>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        )}
      
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
                  className="flex space-x-6 pt-2"
                >
                  <FormItem className="flex items-center space-x-3">
                    <FormControl>
                      <RadioGroupItem value="high" />
                    </FormControl>
                    <FormLabel className="flex items-center font-normal cursor-pointer">
                      <div className="h-4 w-4 bg-attention-high rounded-sm mr-2" />
                      <span>Alto</span>
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3">
                    <FormControl>
                      <RadioGroupItem value="medium" />
                    </FormControl>
                    <FormLabel className="flex items-center font-normal cursor-pointer">
                      <div className="h-4 w-4 bg-attention-medium rounded-sm mr-2" />
                      <span>Médio</span>
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3">
                    <FormControl>
                      <RadioGroupItem value="low" />
                    </FormControl>
                    <FormLabel className="flex items-center font-normal cursor-pointer">
                      <div className="h-4 w-4 bg-attention-low rounded-sm mr-2" />
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
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações relacionadas ao aluno para consultoria online..."
                  className="resize-none min-h-[100px] text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          <div className="flex gap-4">
            <Button 
              type="button"
              variant="destructive"
              onClick={onClose}
              className="px-8 py-3 text-base font-medium"
              size="lg"
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 text-base font-medium"
              size="lg"
            >
              {isSubmitting ? 'Salvando...' : (mode === 'edit' ? 'Salvar Alterações' : 'Finalizar Cadastro')}
            </Button>
          </div>
        </div>
      </div>
    </StepCard>
  );
};

export default ClientDetailsStep;
