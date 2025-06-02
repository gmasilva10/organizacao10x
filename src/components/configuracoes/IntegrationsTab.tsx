
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Eye, EyeOff, Info } from "lucide-react";
import { toast } from "sonner";

const IntegrationsTab = () => {
  const [webhookKey, setWebhookKey] = useState("wh_live_aBc123DeF456GhI789JkL012MnO345PqR678StU901VwX234YzA567BcD890");
  const [showWebhookKey, setShowWebhookKey] = useState(false);

  const handleGenerateNewKey = () => {
    const newKey = `wh_live_${Math.random().toString(36).substr(2, 50)}`;
    setWebhookKey(newKey);
    toast.success("Nova chave de segurança gerada com sucesso!");
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(webhookKey);
    toast.success("Chave copiada para a área de transferência!");
  };

  const handleSaveConfigurations = () => {
    toast.success("Configurações de integração salvas com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Integrações</CardTitle>
          <CardDescription>Conecte-se a outros serviços</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Webhook Eduzz */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Webhook Eduzz</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure a integração com a Eduzz
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhook-key">Chave de Segurança do Webhook</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="webhook-key"
                    type={showWebhookKey ? "text" : "password"}
                    value={webhookKey}
                    readOnly
                    className="pr-20"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
                    <button
                      type="button"
                      onClick={() => setShowWebhookKey(!showWebhookKey)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showWebhookKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <Button variant="outline" onClick={handleGenerateNewKey}>
                  Gerar Nova Chave
                </Button>
              </div>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Como configurar:</strong><br />
                Acesse as configurações de webhook na Eduzz e adicione esta URL para receber notificações de pagamentos e cadastros automaticamente.
              </AlertDescription>
            </Alert>
            
            <Button onClick={handleSaveConfigurations} className="bg-blue-600 hover:bg-blue-700">
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsTab;
