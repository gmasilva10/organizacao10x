
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Client, M0ReferenceType } from "@/types";
import { toast } from "sonner";
import { clients } from "@/services/mockData";

export const useClientData = (clientId: string | undefined) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('clients')
          .select(`
            *,
            client_services (
              client_service_start_date,
              client_service_end_date,
              client_service_value,
              client_service_status
            )
          `)
          .eq('client_id', clientId)
          .single();
        
        if (error) {
          console.error("Error fetching client data:", error);
          // Fallback to mock data if database query fails
          const mockClient = clients.find(c => c.id === clientId);
          if (mockClient) {
            setClient(mockClient);
          } else {
            toast.error("Cliente não encontrado");
          }
        } else if (data) {
          // Map database fields to client object
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
            serviceType: "monthly", // Default value, should be inferred from service duration
            campaignId: "", // Should be fetched from client_services
            startDate: data.client_services?.[0]?.client_service_start_date || new Date().toISOString(),
            endDate: data.client_services?.[0]?.client_service_end_date || new Date().toISOString(),
            value: data.client_services?.[0]?.client_service_value || 0,
            notes: data.client_notes,
            // Adicionar campos de marcos temporais
            anamnesisDate: data.client_anamnesis_date,
            workoutDeliveryDate: data.client_workout_delivery_date,
            m0ReferenceType: data.client_m0_reference_type as M0ReferenceType,
            m0Date: data.client_m0_date
          };
          
          setClient(clientData);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("Erro ao carregar dados do cliente");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  return { client, isLoading };
};
