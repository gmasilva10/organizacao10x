
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CampaignFormProps {
  onClose: () => void;
  campaign?: any;
}

const CampaignForm = ({ onClose, campaign }: CampaignFormProps) => {
  const { organization } = useAuth();
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaign) {
      setCampaignName(campaign.name);
      setCampaignDescription(campaign.description || "");
      setStartDate(campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : "");
      setEndDate(campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : "");
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization) {
      toast.error("Erro ao identificar sua organização");
      return;
    }
    
    setLoading(true);
    
    try {
      if (campaign) {
        const { data, error } = await supabase
          .from('campaigns')
          .update({
            campaign_name: campaignName,
            campaign_description: campaignDescription,
            campaign_start_date: startDate || null,
            campaign_end_date: endDate || null,
            campaign_updated_at: new Date().toISOString()
          })
          .eq('campaign_id', campaign.id)
          .select();
        
        if (error) throw error;
        
        toast.success("Campanha atualizada com sucesso!");
      } else {
        const { data, error } = await supabase
          .from('campaigns')
          .insert([
            {
              organization_id: organization.organization_id,
              campaign_name: campaignName,
              campaign_description: campaignDescription,
              campaign_start_date: startDate || null,
              campaign_end_date: endDate || null,
              campaign_status: 'active'
            }
          ])
          .select();
        
        if (error) throw error;
        
        toast.success("Campanha criada com sucesso!");
      }
      
      onClose();
    } catch (error: any) {
      console.error("Error with campaign:", error);
      toast.error(campaign ? "Erro ao atualizar campanha" : "Erro ao criar campanha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="campaignName">Nome da Campanha</Label>
        <Input 
          id="campaignName" 
          placeholder="Ex: Black Friday 2024" 
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="campaignDescription">Descrição</Label>
        <textarea
          id="campaignDescription"
          rows={3}
          placeholder="Descreva a campanha..."
          className="w-full border border-gray-200 rounded-md p-2"
          value={campaignDescription}
          onChange={(e) => setCampaignDescription(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data de Início</Label>
          <Input 
            id="startDate" 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endDate">Data de Término</Label>
          <Input 
            id="endDate" 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button 
          variant="outline" 
          type="button"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={loading}
        >
          {loading ? "Salvando..." : campaign ? "Salvar Alterações" : "Salvar Campanha"}
        </Button>
      </div>
    </form>
  );
};

export default CampaignForm;
