import React from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { states } from "@/services/mockData";
import StepCard from "./StepCard";

interface ClientPersonalInfoStepProps {
  onNext: () => void;
  onClose: () => void;
}

const ClientPersonalInfoStep = ({ onNext, onClose }: ClientPersonalInfoStepProps) => {
  const { control, watch } = useFormContext();
  
  const name = watch("name");
  const phone = watch("phone");
  const cpf = watch("cpf");
  const email = watch("email");
  const birthDate = watch("birthDate");

  const isStepValid = name && phone && cpf && email && birthDate;

  return (
    <StepCard 
      title="Dados Pessoais" 
      description="Informe os dados básicos do aluno"
    >
      <div className="space-y-6">
        <FormField
          control={control}
          name="name"
          rules={{ required: "Nome do aluno é obrigatório" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Nome completo *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Digite o nome completo" 
                  className="h-12 text-base"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="phone"
            rules={{ required: "Telefone é obrigatório" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Contato do WhatsApp *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+55 11 91234-5678" 
                    className="h-12 text-base"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="cpf"
            rules={{ required: "CPF é obrigatório" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">CPF *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="123.456.789-10" 
                    className="h-12 text-base"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="email"
          rules={{ 
            required: "E-mail é obrigatório", 
            pattern: { 
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "E-mail inválido" 
            } 
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">E-mail *</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="email@exemplo.com" 
                  className="h-12 text-base"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="birthDate"
          rules={{ required: "Data de nascimento é obrigatória" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Data de Nascimento *</FormLabel>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Cidade</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Cidade" 
                    className="h-12 text-base"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Estado</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
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
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">País</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="País" 
                    className="h-12 text-base"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-6 gap-4">
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
            onClick={onNext}
            disabled={!isStepValid}
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

export default ClientPersonalInfoStep;
