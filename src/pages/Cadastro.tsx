
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientsTable from "@/components/cadastro/ClientsTable";
import ServicesTable from "@/components/cadastro/ServicesTable";
import CampaignsTable from "@/components/cadastro/CampaignsTable";
import SalesScriptTable from "@/components/cadastro/SalesScriptTable";

const Cadastro = () => {
  const [activeTab, setActiveTab] = useState("alunos");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Gerenciamento
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie alunos, serviços, campanhas, scripts e equipe
        </p>
      </div>

      <Tabs
        defaultValue="alunos"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger 
            value="alunos" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-6"
          >
            Alunos
          </TabsTrigger>
          <TabsTrigger 
            value="servicos" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-6"
          >
            Serviços
          </TabsTrigger>
          <TabsTrigger 
            value="campanhas" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-6"
          >
            Campanhas
          </TabsTrigger>
          <TabsTrigger 
            value="colaboradores" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-6"
          >
            Colaboradores
          </TabsTrigger>
          <TabsTrigger 
            value="scripts" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-3 px-6"
          >
            Script de Vendas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="alunos">
          <ClientsTable />
        </TabsContent>
        <TabsContent value="servicos">
          <ServicesTable />
        </TabsContent>
        <TabsContent value="campanhas">
          <CampaignsTable />
        </TabsContent>
        <TabsContent value="colaboradores">
          <div className="p-8 text-center">
            <p className="text-lg text-gray-500">Gerenciamento de colaboradores será implementado em breve.</p>
          </div>
        </TabsContent>
        <TabsContent value="scripts">
          <SalesScriptTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Cadastro;
