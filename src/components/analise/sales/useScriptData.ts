
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SalesScriptData } from "./types";

export const useScriptData = () => {
  const { organization } = useAuth();
  const [monthlyScripts, setMonthlyScripts] = useState<SalesScriptData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;

    const fetchScripts = async () => {
      try {
        const { data, error } = await supabase
          .from('sales_scripts')
          .select('*')
          .eq('organization_id', organization.organization_id)
          .order('sales_script_date', { ascending: true });

        if (error) throw error;

        const formattedData: SalesScriptData[] = data.map(script => ({
          id: script.sales_script_id,
          month: script.sales_script_name,
          leads: script.sales_script_whatsapp_reach,
          block1: script.sales_script_block1,
          block2: script.sales_script_block2,
          block3: script.sales_script_block3,
          audio: script.sales_script_audio,
          offer: script.sales_script_block3, // B3 is the offer stage
          sale: script.sales_script_purchase
        }));

        setMonthlyScripts(formattedData);
      } catch (error) {
        console.error('Error fetching sales scripts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScripts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('sales_scripts_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sales_scripts',
          filter: `organization_id=eq.${organization.organization_id}`
        }, 
        () => {
          fetchScripts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization]);

  return { monthlyScripts, loading };
};
