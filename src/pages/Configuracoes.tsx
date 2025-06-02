
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bell, Plug } from "lucide-react";
import ProfileTab from "@/components/configuracoes/ProfileTab";
import NotificationsTab from "@/components/configuracoes/NotificationsTab";
import IntegrationsTab from "@/components/configuracoes/IntegrationsTab";

const Configuracoes = () => {
  const [activeTab, setActiveTab] = useState("perfil");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Configurações
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie as configurações da sua conta e organização
        </p>
      </div>

      <Tabs
        defaultValue="perfil"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger 
            value="perfil" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-6"
          >
            Perfil
          </TabsTrigger>
          <TabsTrigger 
            value="notificacoes" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-6"
          >
            Notificações
          </TabsTrigger>
          <TabsTrigger 
            value="integracoes" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-6"
          >
            Integrações
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="perfil">
          <ProfileTab />
        </TabsContent>
        
        <TabsContent value="notificacoes">
          <NotificationsTab />
        </TabsContent>
        
        <TabsContent value="integracoes">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;
