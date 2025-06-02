
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Campaign } from '@/types';

export const useRealCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.organization_id) {
      setLoading(false);
      return;
    }

    fetchCampaigns();
  }, [organization?.organization_id]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organization.organization_id)
        .order('campaign_created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      const transformedCampaigns: Campaign[] = (campaignsData || []).map(campaign => ({
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        description: campaign.campaign_description || '',
        startDate: campaign.campaign_start_date || '',
        endDate: campaign.campaign_end_date || '',
        status: (campaign.campaign_status === 'completed' ? 'completed' : 'active') as "active" | "completed",
        conversions: campaign.campaign_conversions || 0
      }));

      setCampaigns(transformedCampaigns);
    } catch (err) {
      console.error('Erro ao buscar campanhas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData: Omit<Campaign, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          campaign_name: campaignData.name,
          campaign_description: campaignData.description,
          campaign_start_date: campaignData.startDate,
          campaign_end_date: campaignData.endDate,
          campaign_status: campaignData.status,
          campaign_conversions: campaignData.conversions,
          organization_id: organization.organization_id
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchCampaigns();
      return data;
    } catch (err) {
      console.error('Erro ao criar campanha:', err);
      throw err;
    }
  };

  return { 
    campaigns, 
    loading, 
    error, 
    refetch: fetchCampaigns,
    createCampaign
  };
};
