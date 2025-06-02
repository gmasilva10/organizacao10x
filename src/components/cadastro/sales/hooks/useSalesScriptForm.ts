
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SalesScriptFormValues {
  month: string;
  year: string;
  leads: string;
  block1: string;
  block2: string;
  block3: string;
  sale: string;
}

export interface UseSalesScriptFormProps {
  onClose: () => void;
  script?: any;
}

export const useSalesScriptForm = ({ onClose, script }: UseSalesScriptFormProps) => {
  const { organization } = useAuth();
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const formattedCurrentMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
  
  const [formValues, setFormValues] = useState<SalesScriptFormValues>({
    month: formattedCurrentMonth,
    year: currentYear,
    leads: "0",
    block1: "0",
    block2: "0",
    block3: "0",
    sale: "0",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (script) {
      // Parse month and year from script.month (e.g., "Janeiro 2025")
      const [monthPart, yearPart] = script.month.split(' ');
      setFormValues({
        month: monthPart || formattedCurrentMonth,
        year: yearPart || currentYear,
        leads: script.leads.toString(),
        block1: script.block1.toString(),
        block2: script.block2.toString(),
        block3: script.block3.toString(),
        sale: script.sale.toString(),
      });
    }
  }, [script, formattedCurrentMonth, currentYear]);

  const handleChange = (field: keyof SalesScriptFormValues, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization) {
      toast.error("Erro ao identificar sua organização");
      return;
    }
    
    setLoading(true);
    
    try {
      const leads = parseInt(formValues.leads, 10);
      const sale = parseInt(formValues.sale, 10);
      const conversionRate = leads > 0 ? (sale / leads) * 100 : 0;
      const scriptName = `${formValues.month} ${formValues.year}`;

      // Create the script date as first day of the month
      const monthIndex = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ].indexOf(formValues.month);
      
      const scriptDate = new Date(parseInt(formValues.year), monthIndex, 1).toISOString().split('T')[0];

      if (script) {
        // Update existing script
        const { error } = await supabase
          .from('sales_scripts')
          .update({
            sales_script_name: scriptName,
            sales_script_date: scriptDate,
            sales_script_whatsapp_reach: parseInt(formValues.leads, 10),
            sales_script_block1: parseInt(formValues.block1, 10),
            sales_script_block2: parseInt(formValues.block2, 10),
            sales_script_block3: parseInt(formValues.block3, 10),
            sales_script_audio: 0,
            sales_script_text: 0,
            sales_script_purchase: parseInt(formValues.sale, 10),
            sales_script_conversion_rate: conversionRate,
            sales_script_updated_at: new Date().toISOString()
          })
          .eq('sales_script_id', script.id);
        
        if (error) throw error;
        
        toast.success("Script de vendas atualizado com sucesso!");
      } else {
        // Create new script
        const { error } = await supabase
          .from('sales_scripts')
          .insert([
            {
              organization_id: organization.organization_id,
              sales_script_name: scriptName,
              sales_script_date: scriptDate,
              sales_script_whatsapp_reach: parseInt(formValues.leads, 10),
              sales_script_block1: parseInt(formValues.block1, 10),
              sales_script_block2: parseInt(formValues.block2, 10),
              sales_script_block3: parseInt(formValues.block3, 10),
              sales_script_audio: 0,
              sales_script_text: 0,
              sales_script_purchase: parseInt(formValues.sale, 10),
              sales_script_conversion_rate: conversionRate
            }
          ]);
        
        if (error) throw error;
        
        toast.success("Script de vendas criado com sucesso!");
      }
      
      onClose();
    } catch (error: any) {
      console.error("Error with sales script:", error);
      toast.error(script ? "Erro ao atualizar script" : "Erro ao criar script");
    } finally {
      setLoading(false);
    }
  };

  return {
    formValues,
    loading,
    handleChange,
    handleSubmit
  };
};
