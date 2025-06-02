
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useOrganizationSettings = () => {
  const { organization } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization?.organization_id) return;

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('organization_settings')
          .select('setting_key, setting_value')
          .eq('organization_id', organization.organization_id);

        if (error) throw error;

        const settingsMap = data.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as Record<string, string>);

        setSettings(settingsMap);
      } catch (error) {
        console.error('Error fetching organization settings:', error);
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [organization]);

  const updateSetting = async (key: string, value: string) => {
    if (!organization?.organization_id) return;

    try {
      const { error } = await supabase
        .from('organization_settings')
        .upsert({
          organization_id: organization.organization_id,
          setting_key: key,
          setting_value: value
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Configuração atualizada com sucesso');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  return { settings, loading, updateSetting };
};
