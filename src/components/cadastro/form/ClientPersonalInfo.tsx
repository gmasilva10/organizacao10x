
import React from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { states } from "@/services/mockData";

const ClientPersonalInfo = () => {
  const { control, register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        rules={{ required: "Nome do aluno é obrigatório" }}
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor="name">Nome do Aluno*</FormLabel>
            <FormControl>
              <Input id="name" placeholder="Nome completo" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="phone"
          rules={{ required: "Telefone é obrigatório" }}
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="phone">Telefone*</FormLabel>
              <FormControl>
                <Input id="phone" placeholder="5511912345678" {...field} />
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
            <FormItem className="space-y-2">
              <FormLabel htmlFor="cpf">CPF*</FormLabel>
              <FormControl>
                <Input id="cpf" placeholder="123.456.789-10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="email"
        rules={{ required: "E-mail é obrigatório", pattern: { 
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: "E-mail inválido" 
        } }}
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor="email">E-mail*</FormLabel>
            <FormControl>
              <Input id="email" type="email" placeholder="email@exemplo.com" {...field} />
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
          <FormItem className="space-y-2">
            <FormLabel htmlFor="birthDate">Data de Nascimento*</FormLabel>
            <FormControl>
              <Input id="birthDate" type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="city">Cidade</FormLabel>
              <FormControl>
                <Input id="city" placeholder="Cidade" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="state"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="state">Estado</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
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
        name="country"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor="country">País</FormLabel>
            <FormControl>
              <Input id="country" defaultValue="Brasil" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ClientPersonalInfo;
