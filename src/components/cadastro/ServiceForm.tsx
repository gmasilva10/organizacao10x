import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRealServices } from "@/hooks/useRealServices";
import type { Service } from "@/types";

interface ServiceFormProps {
  onClose: () => void;
  service?: Service;
}

const ServiceForm = ({ onClose, service }: ServiceFormProps) => {
  const { organization } = useAuth();
  const { createService, updateService, loading: servicesLoading } = useRealServices();

  const [serviceIdText, setServiceIdText] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (service) {
      setServiceIdText(service.service_id);
      setServiceName(service.name);
      setServiceDescription(service.description || "");
      setServicePrice(service.price?.toString() || "");
      setIsActive(service.is_active);
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization?.organization_id) {
      toast.error("Erro ao identificar sua organização");
      return;
    }
    if (!serviceIdText.trim()) {
      toast.error("O ID do Serviço é obrigatório.");
      return;
    }
    if (!serviceName.trim()) {
      toast.error("O Nome do Serviço é obrigatório.");
      return;
    }

    setFormLoading(true);
    
    const serviceDataPayload = {
      name: serviceName,
      description: serviceDescription,
      price: parseFloat(servicePrice) || 0,
      is_active: isActive,
      organization_id: organization.organization_id,
    };    

    try {
      if (service) {
        const updatePayload: Partial<Service> = {
          name: serviceName,
          description: serviceDescription,
          price: parseFloat(servicePrice) || undefined,
          is_active: isActive,
        };
        await updateService(service.service_id, updatePayload);
        toast.success("Serviço atualizado com sucesso!");
      } else {
        const createPayload = {
          service_id: serviceIdText,
          name: serviceName,
          description: serviceDescription,
          price: parseFloat(servicePrice) || 0,
        };
        await createService(createPayload as Omit<Service, 'organization_id' | 'created_at' | 'updated_at' | 'is_active'>);
        toast.success("Serviço criado com sucesso!");
      }
      
      onClose();
    } catch (error: any) {
      console.error("Error with service operation:", error);
      toast.error(service ? "Erro ao atualizar serviço" : "Erro ao criar serviço: " + (error.message || error.details || "Erro desconhecido"));
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="serviceIdText">ID do Serviço (ex: mensal, trimestral_vip)</Label>
        <Input 
          id="serviceIdText" 
          placeholder="mensal_basico" 
          value={serviceIdText}
          onChange={(e) => setServiceIdText(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
          required
          disabled={!!service}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="serviceName">Nome do Serviço</Label>
        <Input 
          id="serviceName" 
          placeholder="Ex: Plano Mensal" 
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="serviceDescription">Descrição</Label>
        <textarea
          id="serviceDescription"
          rows={3}
          placeholder="Descreva o serviço..."
          className="w-full border border-gray-200 rounded-md p-2"
          value={serviceDescription}
          onChange={(e) => setServiceDescription(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="servicePrice">Valor (R$)</Label>
        <Input
          id="servicePrice"
          type="number"
          step="0.01"
          min="0"
          placeholder="0,00"
          value={servicePrice}
          onChange={(e) => setServicePrice(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button 
          variant="outline" 
          type="button"
          onClick={onClose}
          disabled={formLoading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={formLoading}
        >
          {formLoading ? "Salvando..." : service ? "Salvar Alterações" : "Salvar Serviço"}
        </Button>
      </div>
    </form>
  );
};

export default ServiceForm;
