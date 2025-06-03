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
    try {
      setLoading(true);
      
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          client_services (
            client_service_start_date,
            client_service_end_date,
            client_service_value,
            service_id
          )
        `)
        .eq('organization_id', organization.organization_id)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Transformar dados do Supabase para o formato esperado pela aplicação
      const transformedClients: Client[] = (clientsData || []).map(client => {
        const service = client.client_services?.[0]; // Pegar o primeiro serviço
        
        // Mapear service_id para serviceType
        const getServiceType = (serviceId: string) => {
          // Esta lógica pode ser melhorada com uma query para a tabela services
          switch (serviceId) {
            case '1': return 'monthly';
            case '2': return 'quarterly';
            case '3': return 'biannual';
            case '4': return 'annual';
            default: return 'monthly';
          }
        };

        // Garantir que attentionLevel seja um valor válido e mapeado para o tipo AttentionLevel
        const getAttentionLevel = (level: string | undefined | null): AttentionLevel => {
          const lowerLevel = String(level).toLowerCase();
          switch (lowerLevel) {
            case "alto":
              return "high";
            case "médio": // Corrigido para lidar com acento
            case "medio":
              return "medium";
            case "baixo":
              return "low";
            default:
              console.warn(`[useRealClients] Nível de atenção não reconhecido: '${level}', usando 'medium' como padrão.`);
              return "medium"; // valor padrão se não reconhecido
          }
        };

        // Garantir que status seja um valor válido
        const getClientStatus = (status: string): ClientStatus => {
          if (status === 'active' || status === 'inactive') {
            return status;
          }
          return 'active'; // valor padrão
        };

        // Garantir que m0ReferenceType seja um valor válido
        const getM0ReferenceType = (type: string): M0ReferenceType => {
          if (type === 'payment' || type === 'anamnesis' || type === 'workout') {
            return type;
          }
          return 'payment'; // valor padrão
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
          serviceType: service ? getServiceType(service.service_id) : 'monthly',
          campaignId: '1', // Implementar quando tivermos campanhas reais
          startDate: service?.client_service_start_date || '',
          endDate: service?.client_service_end_date || '',
          value: service ? Number(service.client_service_value) : 0,
          notes: client.client_notes || '',
          anamnesisDate: client.client_anamnesis_date,
          workoutDeliveryDate: client.client_workout_delivery_date,
          m0ReferenceType: getM0ReferenceType(client.client_m0_reference_type || 'payment'),
          m0Date: client.client_m0_date
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
