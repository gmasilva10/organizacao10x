
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Settings } from "lucide-react";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

const MilestoneConfig = () => {
  const { settings, updateSetting, loading } = useOrganizationSettings();

  const handleReferenceChange = (value: string) => {
    updateSetting('default_m0_reference', value);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings size={16} />
          Marco Temporal (Dia 0)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Definir Dia 0 com base em:
          </span>
          <Select
            value={settings.default_m0_reference || 'payment'}
            onValueChange={handleReferenceChange}
            disabled={loading}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="payment">Data do Pagamento</SelectItem>
              <SelectItem value="anamnesis">Data da Anamnese</SelectItem>
              <SelectItem value="workout">Entrega do Treino</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Esta configuração define qual evento marca o início (Dia 0) da régua de relacionamento para novos clientes.
        </p>
      </CardContent>
    </Card>
  );
};

export default MilestoneConfig;
