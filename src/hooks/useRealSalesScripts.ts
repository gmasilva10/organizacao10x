
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SalesScript {
  id: string;
  name: string;
  date: string;
  whatsappReach: number;
  text: number;
  block1: number;
  block2: number;
  block3: number;
  audio: number;
  purchase: number;
  conversionRate: number;
}

export const useRealSalesScripts = () => {
  const [scripts, setScripts] = useState<SalesScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.organization_id) {
      setLoading(false);
      return;
    }

    fetchScripts();
  }, [organization?.organization_id]);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      
      const { data: scriptsData, error: scriptsError } = await supabase
        .from('sales_scripts')
        .select('*')
        .eq('organization_id', organization.organization_id)
        .order('sales_script_date', { ascending: false });

      if (scriptsError) throw scriptsError;

      const transformedScripts: SalesScript[] = (scriptsData || []).map(script => ({
        id: script.sales_script_id,
        name: script.sales_script_name,
        date: script.sales_script_date,
        whatsappReach: script.sales_script_whatsapp_reach,
        text: script.sales_script_text,
        block1: script.sales_script_block1,
        block2: script.sales_script_block2,
        block3: script.sales_script_block3,
        audio: script.sales_script_audio,
        purchase: script.sales_script_purchase,
        conversionRate: Number(script.sales_script_conversion_rate)
      }));

      setScripts(transformedScripts);
    } catch (err) {
      console.error('Erro ao buscar scripts de vendas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createScript = async (scriptData: Omit<SalesScript, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('sales_scripts')
        .insert([{
          sales_script_name: scriptData.name,
          sales_script_date: scriptData.date,
          sales_script_whatsapp_reach: scriptData.whatsappReach,
          sales_script_text: scriptData.text,
          sales_script_block1: scriptData.block1,
          sales_script_block2: scriptData.block2,
          sales_script_block3: scriptData.block3,
          sales_script_audio: scriptData.audio,
          sales_script_purchase: scriptData.purchase,
          sales_script_conversion_rate: scriptData.conversionRate,
          organization_id: organization.organization_id
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchScripts();
      return data;
    } catch (err) {
      console.error('Erro ao criar script:', err);
      throw err;
    }
  };

  const updateScript = async (scriptId: string, scriptData: Partial<SalesScript>) => {
    try {
      const { error } = await supabase
        .from('sales_scripts')
        .update({
          sales_script_name: scriptData.name,
          sales_script_date: scriptData.date,
          sales_script_whatsapp_reach: scriptData.whatsappReach,
          sales_script_text: scriptData.text,
          sales_script_block1: scriptData.block1,
          sales_script_block2: scriptData.block2,
          sales_script_block3: scriptData.block3,
          sales_script_audio: scriptData.audio,
          sales_script_purchase: scriptData.purchase,
          sales_script_conversion_rate: scriptData.conversionRate
        })
        .eq('sales_script_id', scriptId);

      if (error) throw error;

      await fetchScripts();
    } catch (err) {
      console.error('Erro ao atualizar script:', err);
      throw err;
    }
  };

  const deleteScript = async (scriptId: string) => {
    try {
      const { error } = await supabase
        .from('sales_scripts')
        .delete()
        .eq('sales_script_id', scriptId);

      if (error) throw error;

      await fetchScripts();
    } catch (err) {
      console.error('Erro ao deletar script:', err);
      throw err;
    }
  };

  return { 
    scripts, 
    loading, 
    error, 
    refetch: fetchScripts,
    createScript,
    updateScript,
    deleteScript
  };
};
