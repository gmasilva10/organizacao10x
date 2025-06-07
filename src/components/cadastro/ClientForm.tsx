import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { User, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import StepIndicator from "./form/StepIndicator";
import ClientPersonalInfoStep from "./form/ClientPersonalInfoStep";
import ClientServiceInfoStep from "./form/ClientServiceInfoStep";
import ClientDetailsStep from "./form/ClientDetailsStep";
import { Client } from "@/types";

interface ClientFormProps {
  onClose: () => void;
  client?: Client;
}

const ClientForm = ({ onClose, client }: ClientFormProps) => {
  const [currentStep, setCurrentStep] = useState("dados");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { organization, user } = useAuth();

  const steps = [
    {
      id: "dados",
      label: "Dados",
      icon: User,
    },
    {
      id: "servico",
      label: "Serviço",
      icon: CreditCard,
    },
    {
      id: "detalhes",
      label: "Detalhes",
      icon: FileText,
    }
  ];

  // Lógica para construir os valores padrão dinamicamente
  const getDefaultValues = () => {
    if (client) {
      // Modo Edição
      return {
        name: client.name || "",
        phone: client.phone || "",
        cpf: client.cpf || "",
        email: client.email || "",
        birthDate: client.birthDate ? new Date(client.birthDate).toISOString().split('T')[0] : "",
        city: client.city || "",
        state: client.state || "",
        country: client.country || 'Brasil',
        attentionLevel: client.attentionLevel || 'low',
        observation: client.notes || "",
        status: client.status || 'active',
        service_id: client.last_sale?.service_id || "",
        serviceValue: client.last_sale?.price || 0,
        serviceDurationDays: (client.last_sale as any)?.duration_days || 0,
        paymentMethod: client.last_sale?.payment_method || "Cartão de Crédito",
        installments: client.last_sale?.installments || "1x",
        collaborator: client.last_sale?.collaborator_id || "",
        paymentDate: client.last_sale?.payment_date ? new Date(client.last_sale.payment_date).toISOString().split('T')[0] : "",
        clientType: "LEAD",
        m0Type: "",
      };
    } else {
      // Modo Criação
      return {
        name: "",
        phone: "",
        cpf: "",
        email: "",
        birthDate: "",
        city: "",
        state: "",
        country: "Brasil",
        collaborator: "",
        clientType: "LEAD",
        service_id: "",
        serviceValue: 0,
        serviceDurationDays: 0,
        paymentMethod: "Cartão de Crédito",
        installments: "1x",
        paymentDate: "",
        attentionLevel: "low",
        m0Type: "",
        observation: "",
        client_status: 'active',
      };
    }
  };

  const methods = useForm({
    defaultValues: getDefaultValues(),
  });

  // useEffect para resetar o formulário quando os dados do cliente (em modo de edição)
  // são carregados. Isso garante que o formulário seja populado com os dados corretos.
  useEffect(() => {
    if (client) {
      methods.reset(getDefaultValues());
    }
  }, [client, methods]);

  useEffect(() => {
    if (!user) {
      toast.warning("Usuário não autenticado", {
        description: "Você precisa estar logado para cadastrar clientes."
      });
    } else if (!organization?.organization_id) {
      toast.warning("Associação de organização não encontrada", {
        description: "Você precisa estar associado a uma organização para cadastrar clientes."
      });
    }
  }, [organization, user]);

  const handleNext = () => {
    if (currentStep === "dados") {
      setCompletedSteps(prev => [...prev, "dados"]);
      setCurrentStep("servico");
    } else if (currentStep === "servico") {
      setCompletedSteps(prev => [...prev, "servico"]);
      setCurrentStep("detalhes");
    }
  };

  const handlePrevious = () => {
    if (currentStep === "servico") {
      setCurrentStep("dados");
    } else if (currentStep === "detalhes") {
      setCurrentStep("servico");
    }
  };

  const onSubmit = async () => {
    const data = methods.getValues();
    setIsSubmitting(true);
    
    try {
      if (!user) throw new Error("Você precisa estar logado");
      if (!organization?.organization_id) throw new Error("Você não está associado a uma organização");

      const clientData = {
        client_name: data.name,
        client_email: data.email,
        client_phone: data.phone.replace(/\D/g, ''),
        client_cpf: data.cpf.replace(/\D/g, ''),
        client_birth_date: data.birthDate || null,
        client_city: data.city || null,
        client_state: data.state || null,
        client_country: data.country,
        client_attention_level: data.attentionLevel,
        client_notes: data.observation || null,
        updated_at: new Date().toISOString(),
        client_status: data.status,
      };

      if (client?.id) {
        // MODO DE EDIÇÃO: Atualizar cliente existente
        const finalUpdateData = {
          ...clientData,
          client_status: data.status,
        };

        const { error: updateError } = await supabase
          .from('clients')
          .update(finalUpdateData)
          .eq('client_id', client.id);

        if (updateError) throw updateError;
        
        // Atualizar também os dados do serviço, se houver uma última venda
        if (client.last_sale?.client_service_id) {
          const serviceUpdateData: { [key: string]: any } = {
            service_id: data.service_id,
            client_service_value: data.serviceValue,
            payment_method: data.paymentMethod,
            installments: data.installments,
            payment_date: data.paymentDate || null,
            duration_days: data.serviceDurationDays || null,
          };

          // Recalcular o período do serviço se a data de pagamento e a duração forem fornecidas
          if (data.paymentDate && data.serviceDurationDays && data.serviceDurationDays > 0) {
            const startDate = new Date(data.paymentDate);
            // Adicionar um dia para corrigir a questão do fuso horário/UTC na criação da data
            startDate.setDate(startDate.getDate() + 1);

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + Number(data.serviceDurationDays));
            
            serviceUpdateData.client_service_start_date = startDate.toISOString().split('T')[0];
            serviceUpdateData.client_service_end_date = endDate.toISOString().split('T')[0];
          }

          const { error: serviceUpdateError } = await supabase
            .from('client_services')
            .update(serviceUpdateData)
            .eq('client_service_id', client.last_sale.client_service_id);

          if (serviceUpdateError) throw serviceUpdateError;
        }

        toast.success("Cliente atualizado com sucesso!");
      } else {
        // MODO DE CRIAÇÃO: Inserir novo cliente e serviço
        const { data: settingsData } = await supabase
          .from('organization_settings')
          .select('setting_value')
          .eq('organization_id', organization.organization_id)
          .eq('setting_key', 'default_m0_reference')
          .single();

        const defaultM0Reference = settingsData?.setting_value || 'payment';

        const finalClientData = {
          ...clientData,
          client_status: "active",
          client_m0_reference_type: defaultM0Reference,
          organization_id: organization.organization_id,
          created_by: user.id
        };

        const { data: insertedClient, error: clientError } = await supabase
          .from('clients')
          .insert([finalClientData])
          .select('client_id')
          .single();

        if (clientError) throw new Error(`Erro ao cadastrar cliente: ${clientError.message}`);
        if (!insertedClient?.client_id) throw new Error("Não foi possível obter o ID do cliente após cadastro");

        // Lógica para salvar o serviço associado (se houver)
        if (data.service_id && data.serviceValue > 0 && data.serviceDurationDays && data.serviceDurationDays > 0) {
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + Number(data.serviceDurationDays));

          const serviceData = {
            client_id: insertedClient.client_id,
            service_id: data.service_id,
            organization_id: organization.organization_id,
            client_service_start_date: startDate.toISOString().split('T')[0],
            client_service_end_date: endDate.toISOString().split('T')[0],
            client_service_value: data.serviceValue,
            client_service_status: "active",
            created_by: user.id
          };

          const { error: serviceError } = await supabase
            .from('client_services')
            .insert([serviceData]);

          if (serviceError) {
            toast.warning("Cliente cadastrado, mas houve erro ao salvar o serviço", { description: serviceError.message });
          }

          if (defaultM0Reference === 'payment') {
            await supabase
              .from('clients')
              .update({ client_m0_date: startDate.toISOString().split('T')[0] })
              .eq('client_id', insertedClient.client_id);
          }
        }
        toast.success("Cliente cadastrado com sucesso!");
      }
      onClose();
    } catch (error: any) {
      console.error("Erro no formulário de cliente:", error);
      toast.error("Erro no formulário de cliente:", { description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-3">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Cadastrar cliente</h1>
        <p className="text-gray-600 text-sm">Preencha as informações do novo aluno</p>
      </div>

      <StepIndicator 
        steps={steps}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      <FormProvider {...methods}>
        <form className="space-y-3">
          {currentStep === "dados" && (
            <ClientPersonalInfoStep onNext={handleNext} onClose={onClose} />
          )}
          
          {currentStep === "servico" && (
            <ClientServiceInfoStep 
              onPrevious={handlePrevious}
              onNext={handleNext}
              onClose={onClose}
            />
          )}

          {currentStep === "detalhes" && (
            <ClientDetailsStep 
              onPrevious={handlePrevious}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              mode={client ? 'edit' : 'create'}
              onClose={onClose}
            />
          )}
        </form>
      </FormProvider>
    </div>
  );
};

export default ClientForm;

