import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Client, M0ReferenceType } from "@/types";
import { toast } from "sonner";

export const useClientData = (clientId: string | undefined) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientData = useCallback(async () => {
    if (!clientId) {
      setIsLoading(false);
      setClient(null);
      return;
    }
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_services (
            client_service_id,
            client_service_start_date,
            client_service_end_date,
            client_service_value,
            client_service_status,
            service_catalog (name)
          )
        `)
        .eq('client_id', clientId)
        .single();
      
      if (error) {
        console.error("Error fetching client data:", error);
        toast.error("Erro ao buscar dados do cliente", { description: error.message });
        setClient(null);
      } else if (data) {
        const clientServices = (data.client_services || []).map((cs: any) => ({
          id: cs.client_service_id,
          startDate: cs.client_service_start_date,
          endDate: cs.client_service_end_date,
          serviceName: cs.service_catalog?.name || "Serviço não especificado",
          value: cs.client_service_value,
          status: cs.client_service_status,
        }));

        const clientData: Client = {
          id: data.client_id,
          name: data.client_name,
          email: data.client_email,
          phone: data.client_phone,
          cpf: data.client_cpf,
          city: data.client_city,
          state: data.client_state,
          country: data.client_country,
          birthDate: data.client_birth_date,
          attentionLevel: data.client_attention_level as "high" | "medium" | "low",
          status: data.client_status as "active" | "inactive",
          notes: data.client_notes,
          anamnesisDate: data.client_anamnesis_date,
          workoutDeliveryDate: data.client_workout_delivery_date,
          m0ReferenceType: data.client_m0_reference_type as M0ReferenceType,
          m0Date: data.client_m0_date,
          serviceType: clientServices.length > 0 ? clientServices[0].serviceName : "Nenhum serviço",
          campaignId: "",
          startDate: clientServices.length > 0 ? clientServices[0].startDate : new Date().toISOString(),
          endDate: clientServices.length > 0 ? clientServices[0].endDate : new Date().toISOString(),
          value: clientServices.length > 0 ? clientServices[0].value : 0,
        };
        setClient(clientData);
      }
    } catch (error: any) {
      console.error("Unexpected error in fetchClientData:", error);
      toast.error("Erro inesperado ao carregar dados do cliente", { description: error.message });
      setClient(null);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  return { client, isLoading, refetchData: fetchClientData };
};
