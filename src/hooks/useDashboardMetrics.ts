import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardMetrics } from '@/types';

export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.organization_id) {
      setLoading(false);
      return;
    }

    fetchDashboardMetrics();
  }, [organization?.organization_id]);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1);
      const firstDayPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
      const lastDayPreviousMonth = new Date(currentYear, currentMonth, 0);

      // Query para clientes ativos
      const { data: activeClientsData, error: activeClientsError } = await supabase
        .from('clients')
        .select('client_id, created_at')
        .eq('organization_id', organization.organization_id)
        .eq('client_status', 'active');

      if (activeClientsError) throw activeClientsError;

      // Query para serviços do mês atual
      const { data: currentMonthServices, error: currentServicesError } = await supabase
        .from('client_services')
        .select('client_service_value, client_id!inner(organization_id)')
        .gte('client_service_start_date', firstDayCurrentMonth.toISOString().split('T')[0])
        .eq('client_service_status', 'active');

      if (currentServicesError) throw currentServicesError;

      // Query para serviços do mês anterior
      const { data: previousMonthServices, error: previousServicesError } = await supabase
        .from('client_services')
        .select('client_service_value, client_id!inner(organization_id)')
        .gte('client_service_start_date', firstDayPreviousMonth.toISOString().split('T')[0])
        .lte('client_service_start_date', lastDayPreviousMonth.toISOString().split('T')[0])
        .eq('client_service_status', 'active');

      if (previousServicesError) throw previousServicesError;

      // Calcular métricas
      const activeClientsCount = activeClientsData?.length || 0;

      // Clientes ativos que já existiam antes do início do mês corrente
      const activeClientsAtStartOfMonth = activeClientsData?.filter(client =>
        new Date(client.created_at) < firstDayCurrentMonth
      ).length || 0;

      const newLeadsThisMonth = activeClientsData?.filter(client => 
        new Date(client.created_at) >= firstDayCurrentMonth
      ).length || 0;

      // Novos leads do mês anterior
      const newLeadsPreviousMonth = activeClientsData?.filter(client => {
        const createdAt = new Date(client.created_at);
        return createdAt >= firstDayPreviousMonth && createdAt <= lastDayPreviousMonth;
      }).length || 0;

      const currentMonthRevenue = currentMonthServices
        ?.reduce((sum, service) => sum + Number(service.client_service_value), 0) || 0;
      
      const previousMonthRevenue = previousMonthServices
        ?.reduce((sum, service) => sum + Number(service.client_service_value), 0) || 0;

      // Calcular percentuais de mudança
      const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) {
          if (current > 0) return 100; 
          return 0; 
        }
        return parseFloat((((current - previous) / previous) * 100).toFixed(1));
      };

      const metrics: DashboardMetrics = {
        activeClients: {
          count: activeClientsCount,
          changePercentage: calculatePercentageChange(activeClientsCount, activeClientsAtStartOfMonth)
        },
        monthlyRevenue: {
          amount: currentMonthRevenue,
          changePercentage: calculatePercentageChange(currentMonthRevenue, previousMonthRevenue)
        },
        newLeads: {
          count: newLeadsThisMonth,
          changePercentage: calculatePercentageChange(newLeadsThisMonth, newLeadsPreviousMonth)
        },
        renewals: {
          count: 0,
          changePercentage: 0
        },
        cancellations: {
          count: 0,
          changePercentage: 0
        }
      };

      setMetrics(metrics);
    } catch (err) {
      console.error('Erro ao buscar métricas do dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return { metrics, loading, error, refetch: fetchDashboardMetrics };
};
