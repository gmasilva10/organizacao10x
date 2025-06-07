import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client, AttentionLevel, ClientStatus, M0ReferenceType } from '@/types';

export const useRealClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.organization_id) {
      setLoading(false);
      return;
    }

    fetchClients();
  }, [organization?.organization_id]);

  const fetchClients = async () => {
    if (!organization?.organization_id) {
      setError("Organização não identificada. Não é possível carregar os clientes.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          client_services (
            *,
            service_catalog (
              name
            )
          )
        `)
        .eq('organization_id', organization.organization_id)
        .order('created_at', { ascending: false })
        .order('client_service_start_date', { foreignTable: 'client_services', ascending: false });

      if (clientsError) throw clientsError;

      const transformedClients: Client[] = (clientsData || []).map(client => {
        const lastService = client.client_services?.[0];
        
        const getAttentionLevel = (level: string | undefined | null): AttentionLevel => {
          const lowerLevel = String(level).toLowerCase();
          switch (lowerLevel) {
            case "alto":
            case "alta":
              return "high";
            case "médio":
            case "medio":
            case "media":
              return "medium";
            case "baixo":
            case "baixa":
              return "low";
            default:
              return "low"; 
          }
        };

        const getClientStatus = (status: string): ClientStatus => {
          if (status === 'active' || status === 'inactive') return status;
          return 'active';
        };

        const getM0ReferenceType = (type: string): M0ReferenceType => {
          if (type === 'payment' || type === 'anamnesis' || type === 'workout') return type;
          return 'payment';
        };

        const getServiceStatus = (status: string | undefined | null): ServiceStatus => {
          const lowerStatus = String(status).toLowerCase();
          if (lowerStatus === 'active' || lowerStatus === 'inactive' || lowerStatus === 'canceled') {
            return lowerStatus as ServiceStatus;
          }
          return 'inactive';
        };

        return {
          id: client.client_id,
          name: client.client_name,
          email: client.client_email,
          phone: client.client_phone,
          cpf: client.client_cpf || '',
          city: client.client_city || '',
          state: client.client_state || '',
          country: client.client_country || 'Brasil',
          birthDate: client.client_birth_date || '',
          attentionLevel: getAttentionLevel(client.client_attention_level),
          status: getClientStatus(client.client_status || 'active'),
          notes: client.client_notes || '',
          anamnesisDate: client.client_anamnesis_date,
          workoutDeliveryDate: client.client_workout_delivery_date,
          m0ReferenceType: getM0ReferenceType(client.client_m0_reference_type || 'payment'),
          m0Date: client.client_m0_date,
          services: client.client_services || [],
          last_sale: lastService ? {
            client_service_id: lastService.client_service_id,
            service_id: lastService.service_id,
            service_name: lastService.service_catalog?.name || 'N/A',
            price: Number(lastService.client_service_value),
            duration_days: lastService.duration_days,
            start_date: lastService.client_service_start_date,
            end_date: lastService.client_service_end_date,
            payment_method: lastService.client_service_payment_method,
            installments: lastService.client_service_installments,
            collaborator_id: lastService.collaborator_id,
            payment_date: lastService.client_service_payment_date,
            status: getServiceStatus(lastService.client_service_status),
          } : undefined,
          campaignId: client.campaign_id || '',
        };
      });

      setClients(transformedClients);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return { clients, loading, error, refetch: fetchClients };
};
