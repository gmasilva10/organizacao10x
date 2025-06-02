
import React from "react";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MockDataButton = () => {
  const { organization } = useAuth();

  const insertMockData = async () => {
    if (!organization) {
      toast.error("Erro ao identificar sua organização");
      return;
    }

    const mockScripts = [
      { month: "Janeiro", year: "2025", leads: 850, block1: 510, block2: 382, block3: 255, sale: 89 },
      { month: "Fevereiro", year: "2025", leads: 920, block1: 552, block2: 414, block3: 276, sale: 97 },
      { month: "Março", year: "2025", leads: 780, block1: 468, block2: 351, block3: 234, sale: 82 },
      { month: "Abril", year: "2025", leads: 1100, block1: 660, block2: 495, block3: 330, sale: 116 },
      { month: "Maio", year: "2025", leads: 950, block1: 570, block2: 428, block3: 285, sale: 100 },
      { month: "Junho", year: "2025", leads: 1200, block1: 720, block2: 540, block3: 360, sale: 126 },
      { month: "Julho", year: "2025", leads: 1050, block1: 630, block2: 473, block3: 315, sale: 110 },
      { month: "Agosto", year: "2025", leads: 890, block1: 534, block2: 401, block3: 267, sale: 93 },
      { month: "Setembro", year: "2025", leads: 1150, block1: 690, block2: 518, block3: 345, sale: 121 },
      { month: "Outubro", year: "2025", leads: 980, block1: 588, block2: 441, block3: 294, sale: 103 },
      { month: "Novembro", year: "2025", leads: 1300, block1: 780, block2: 585, block3: 390, sale: 137 },
      { month: "Dezembro", year: "2025", leads: 1400, block1: 840, block2: 630, block3: 420, sale: 147 }
    ];

    try {
      const scriptsToInsert = mockScripts.map(script => ({
        organization_id: organization.organization_id,
        sales_script_name: `${script.month} ${script.year}`,
        sales_script_date: new Date(`${script.year}-${String(mockScripts.indexOf(script) + 1).padStart(2, '0')}-01`).toISOString().split('T')[0],
        sales_script_whatsapp_reach: script.leads,
        sales_script_block1: script.block1,
        sales_script_block2: script.block2,
        sales_script_block3: script.block3,
        sales_script_audio: 0,
        sales_script_text: 0,
        sales_script_purchase: script.sale,
        sales_script_conversion_rate: (script.sale / script.leads) * 100
      }));

      const { error } = await supabase
        .from('sales_scripts')
        .insert(scriptsToInsert);

      if (error) throw error;

      toast.success("Dados mock inseridos com sucesso!");
    } catch (error) {
      console.error('Error inserting mock data:', error);
      toast.error('Erro ao inserir dados mock');
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-2" 
      onClick={insertMockData}
    >
      <Database size={16} />
      Inserir Dados Mock 2025
    </Button>
  );
};

export default MockDataButton;
