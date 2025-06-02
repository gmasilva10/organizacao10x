
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const NotificationsTab = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);

  const handleSavePreferences = () => {
    toast.success("Preferências de notificação salvas com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Preferências de Notificação</CardTitle>
          <CardDescription>Defina como deseja ser notificado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="email-notifications" className="text-base font-medium">
                Notificações por Email
              </Label>
              <p className="text-sm text-gray-600">
                Receba notificações por email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="system-notifications" className="text-base font-medium">
                Notificações do Sistema
              </Label>
              <p className="text-sm text-gray-600">
                Receba notificações no sistema
              </p>
            </div>
            <Switch
              id="system-notifications"
              checked={systemNotifications}
              onCheckedChange={setSystemNotifications}
            />
          </div>
          
          <Button onClick={handleSavePreferences} className="bg-gray-800 hover:bg-gray-900">
            Salvar Preferências
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;
