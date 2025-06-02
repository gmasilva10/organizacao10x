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

interface ClientFormProps {
  onClose: () => void;
}

const ClientForm = ({ onClose }: ClientFormProps) => {
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

  const methods = useForm({
    defaultValues: {
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
      service: "",
      serviceValue: 0,
      serviceDurationMonths: 0,
      paymentMethod: "Cartão de Crédito",
      installments: "1x",
      paymentDate: "",
      attentionLevel: "medium",
      m0Type: "",
      observation: ""
    }
  });

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
    console.log("Form data:", data);
    setIsSubmitting(true);
    
    try {
      if (!user) {
        throw new Error("Você precisa estar logado para cadastrar clientes");
      }

      if (!organization?.organization_id) {
        throw new Error("Você precisa estar associado a uma organização para cadastrar clientes");
      }

      // Buscar configuração padrão de marco temporal
      const { data: settingsData } = await supabase
        .from('organization_settings')
        .select('setting_value')
        .eq('organization_id', organization.organization_id)
        .eq('setting_key', 'default_m0_reference')
        .single();

      const defaultM0Reference = settingsData?.setting_value || 'payment';

      const clientData = {
        client_name: data.name,
        client_email: data.email,
        client_phone: data.phone.replace(/\D/g, ''),
        client_cpf: data.cpf.replace(/\D/g, ''),
        client_birth_date: data.birthDate ? data.birthDate : null,
        client_city: data.city || null,
        client_state: data.state || null,
        client_country: data.country,
        client_attention_level: data.attentionLevel,
        client_m0_type: data.m0Type || null,
        client_status: "active",
        client_notes: data.observation || null,
        client_m0_reference_type: defaultM0Reference,
        organization_id: organization.organization_id,
        created_by: user.id
      };

      console.log("Enviando dados para o Supabase:", clientData);

      const { data: insertedClient, error: clientError } = await supabase
        .from('clients')
        .insert([clientData])
        .select('client_id')
        .single();

      if (clientError) {
        console.error("Erro ao inserir cliente:", clientError);
        throw new Error(`Erro ao cadastrar cliente: ${clientError.message}`);
      }

      if (!insertedClient?.client_id) {
        throw new Error("Não foi possível obter o ID do cliente após cadastro");
      }

      if (data.service && data.serviceValue > 0 && data.serviceDurationMonths && data.serviceDurationMonths > 0) {
        const startDate = new Date();
        const endDate = new Date(startDate);
        
        endDate.setMonth(endDate.getMonth() + data.serviceDurationMonths);

        const serviceData = {
          client_id: insertedClient.client_id,
          service_id: data.service,
          organization_id: organization.organization_id,
          client_service_start_date: startDate.toISOString().split('T')[0],
          client_service_end_date: endDate.toISOString().split('T')[0],
          client_service_value: data.serviceValue,
          client_service_status: "active",
          created_by: user.id
        };

        console.log("Enviando dados de serviço (com service_id do catálogo):", serviceData);

        const { error: serviceError } = await supabase
          .from('client_services')
          .insert([serviceData]);

        if (serviceError) {
          console.error("Erro ao salvar serviço do cliente:", serviceError);
          toast.warning("Cliente cadastrado, mas houve um erro ao salvar o serviço", {
            description: serviceError.message
          });
        }

        // Atualizar M0 date se o marco padrão for payment
        if (defaultM0Reference === 'payment') {
          const { error: m0Error } = await supabase
            .from('clients')
            .update({ client_m0_date: startDate.toISOString().split('T')[0] })
            .eq('client_id', insertedClient.client_id);

          if (m0Error) {
            console.error("Erro ao definir data M0:", m0Error);
          }
        }
      }

      toast.success("Cliente cadastrado com sucesso!");
      onClose();
    } catch (error: any) {
      console.error("Erro ao cadastrar cliente:", error);
      toast.error("Erro ao cadastrar cliente", {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <ClientPersonalInfoStep onNext={handleNext} />
          )}
          
          {currentStep === "servico" && (
            <ClientServiceInfoStep 
              onPrevious={handlePrevious}
              onNext={handleNext}
            />
          )}

          {currentStep === "detalhes" && (
            <ClientDetailsStep 
              onPrevious={handlePrevious}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </form>
      </FormProvider>
    </div>
  );
};

export default ClientForm;
