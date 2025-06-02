
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Client } from "@/types";
import ClientGeneralView from "./ClientGeneralView";
import ClientSalesView from "./ClientSalesView";
import ClientCommunicationsView from "./ClientCommunicationsView";
import ClientOnboardingView from "./ClientOnboardingView";

interface ClientProfileTabsProps {
  client: Client;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ClientProfileTabs = ({ client, activeTab, setActiveTab }: ClientProfileTabsProps) => {
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="bg-white border rounded-lg overflow-hidden"
    >
      <TabsList className="border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
        <TabsTrigger 
          value="general" 
          className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-6"
        >
          Visão Geral
        </TabsTrigger>
        <TabsTrigger 
          value="sales" 
          className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-6"
        >
          Vendas
        </TabsTrigger>
        <TabsTrigger 
          value="communications" 
          className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-6"
        >
          Comunicações
        </TabsTrigger>
        <TabsTrigger 
          value="onboarding" 
          className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-6"
        >
          Onboarding
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <ClientGeneralView client={client} />
      </TabsContent>
      <TabsContent value="sales">
        <ClientSalesView clientId={client.id} />
      </TabsContent>
      <TabsContent value="communications">
        <ClientCommunicationsView clientId={client.id} />
      </TabsContent>
      <TabsContent value="onboarding">
        <ClientOnboardingView clientId={client.id} />
      </TabsContent>
    </Tabs>
  );
};

export default ClientProfileTabs;
