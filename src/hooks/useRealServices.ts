import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Service } from '@/types';

export const useRealServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.organization_id) {
      setLoading(false);
      return;
    }

    fetchServices();
  }, [organization?.organization_id]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      const { data: servicesData, error: servicesError } = await supabase
        .from('service_catalog')
        .select('*')
        .eq('organization_id', organization.organization_id)
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      const transformedServices: Service[] = (servicesData || []).map(service => ({
        service_id: service.service_id,
        organization_id: service.organization_id,
        name: service.name,
        price: Number(service.price),
        duration_months: service.duration_months,
        description: service.description || '',
        is_active: service.is_active,
        created_at: service.created_at,
        updated_at: service.updated_at
      }));

      setServices(transformedServices);
    } catch (err) {
      console.error('Erro ao buscar serviços:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceDataInput: Omit<Service, 'organization_id' | 'created_at' | 'updated_at' | 'is_active'> & { service_id: string }) => {
    if (!organization?.organization_id) {
      console.error('createService: organization_id is missing');
      throw new Error('Organização não encontrada para criar o serviço.');
    }
    try {
      const payloadToInsert = {
        service_id: serviceDataInput.service_id,
        name: serviceDataInput.name,
        description: serviceDataInput.description,
        price: serviceDataInput.price,
        duration_months: serviceDataInput.duration_months,
        organization_id: organization.organization_id,
        is_active: true
      };

      const { data, error } = await supabase
        .from('service_catalog')
        .insert([payloadToInsert])
        .select()
        .single();

      if (error) throw error;

      await fetchServices();
      return data;
    } catch (err) {
      console.error('Erro ao criar serviço no hook:', err);
      throw err;
    }
  };

  const updateService = async (service_id_text: string, serviceDataInput: Partial<Omit<Service, 'service_id' | 'organization_id' | 'created_at' | 'updated_at'>>) => {
    if (!organization?.organization_id) {
      console.error('updateService: organization_id is missing');
      throw new Error('Organização não encontrada para atualizar o serviço.');
    }
    try {
      const updatePayload: { [key: string]: any } = {};
      if (serviceDataInput.name !== undefined) updatePayload.name = serviceDataInput.name;
      if (serviceDataInput.price !== undefined) updatePayload.price = serviceDataInput.price;
      if (serviceDataInput.duration_months !== undefined) updatePayload.duration_months = serviceDataInput.duration_months;
      if (serviceDataInput.description !== undefined) updatePayload.description = serviceDataInput.description;
      if (serviceDataInput.is_active !== undefined) updatePayload.is_active = serviceDataInput.is_active;

      if (Object.keys(updatePayload).length === 0) {
        console.warn("updateService: No fields to update.");
        return;
      }

      const { error } = await supabase
        .from('service_catalog')
        .update(updatePayload)
        .eq('service_id', service_id_text)
        .eq('organization_id', organization.organization_id);

      if (error) throw error;

      await fetchServices();
    } catch (err) {
      console.error('Erro ao atualizar serviço:', err);
      throw err;
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('service_catalog')
        .delete()
        .eq('service_id', serviceId)
        .eq('organization_id', organization.organization_id);

      if (error) throw error;

      await fetchServices(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao deletar serviço:', err);
      throw err;
    }
  };

  return { 
    services, 
    loading, 
    error, 
    refetch: fetchServices,
    createService,
    updateService,
    deleteService
  };
};
