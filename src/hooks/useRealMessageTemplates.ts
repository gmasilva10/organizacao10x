
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MessageTemplate {
  id: string;
  code: string;
  content: string;
  description: string;
  dayOffset: number;
  objective: string;
  category: string;
}

export const useRealMessageTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.organization_id) {
      setLoading(false);
      return;
    }

    fetchTemplates();
  }, [organization?.organization_id]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      const { data: templatesData, error: templatesError } = await supabase
        .from('message_templates')
        .select('*')
        .eq('organization_id', organization.organization_id)
        .order('message_template_created_at', { ascending: false });

      if (templatesError) throw templatesError;

      const transformedTemplates: MessageTemplate[] = (templatesData || []).map(template => ({
        id: template.message_template_id,
        code: template.message_template_code,
        content: template.message_template_content,
        description: template.message_template_description,
        dayOffset: template.message_template_day_offset,
        objective: template.message_template_objective || '',
        category: template.message_template_category || ''
      }));

      setTemplates(transformedTemplates);
    } catch (err) {
      console.error('Erro ao buscar templates de mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: Omit<MessageTemplate, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .insert([{
          message_template_code: templateData.code,
          message_template_content: templateData.content,
          message_template_description: templateData.description,
          message_template_day_offset: templateData.dayOffset,
          message_template_objective: templateData.objective,
          message_template_category: templateData.category,
          organization_id: organization.organization_id
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchTemplates();
      return data;
    } catch (err) {
      console.error('Erro ao criar template:', err);
      throw err;
    }
  };

  const updateTemplate = async (templateId: string, templateData: Partial<MessageTemplate>) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .update({
          message_template_code: templateData.code,
          message_template_content: templateData.content,
          message_template_description: templateData.description,
          message_template_day_offset: templateData.dayOffset,
          message_template_objective: templateData.objective,
          message_template_category: templateData.category
        })
        .eq('message_template_id', templateId);

      if (error) throw error;

      await fetchTemplates();
    } catch (err) {
      console.error('Erro ao atualizar template:', err);
      throw err;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('message_template_id', templateId);

      if (error) throw error;

      await fetchTemplates();
    } catch (err) {
      console.error('Erro ao deletar template:', err);
      throw err;
    }
  };

  return { 
    templates, 
    loading, 
    error, 
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  };
};
