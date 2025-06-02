
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClientsAnalysis from "@/components/analise/ClientsAnalysis";
import FinancialAnalysis from "@/components/analise/FinancialAnalysis";
import SalesAnalysis from "@/components/analise/SalesAnalysis";
import { Users, TrendingUp, Target } from "lucide-react";

const Analise = () => {
  const [activeTab, setActiveTab] = useState("clients");

  const tabConfig = [
    {
      id: "clients",
      label: "Análise de Alunos",
      icon: Users,
      description: "Status, distribuição e LTV dos alunos"
    },
    {
      id: "financial",
      label: "Análise Financeira",
      icon: TrendingUp,
      description: "Receitas, projeções e inteligência temporal"
    },
    {
      id: "sales",
      label: "Funil de Vendas",
      icon: Target,
      description: "Conversão e performance dos scripts"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Centro de Análise
        </h1>
        <p className="text-gray-600">
          Visualize e analise os dados de desempenho do seu negócio com insights inteligentes
        </p>
      </div>

      <Tabs
        defaultValue="clients"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tabConfig.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Card 
                key={tab.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                  activeTab === tab.id 
                    ? 'ring-2 ring-blue-600 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl border-blue-600' 
                    : 'hover:bg-gray-50 border-gray-200 shadow-md'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'bg-white/20 text-white backdrop-blur-sm' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className={`text-lg font-bold transition-colors duration-300 ${
                        activeTab === tab.id ? 'text-white' : 'text-gray-800'
                      }`}>
                        {tab.label}
                      </CardTitle>
                      <p className={`text-sm mt-1 transition-colors duration-300 ${
                        activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {tab.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <TabsList className="hidden">
          {tabConfig.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="animate-fade-in">
          <TabsContent value="clients" className="space-y-6">
            <ClientsAnalysis />
          </TabsContent>
          <TabsContent value="financial" className="space-y-6">
            <FinancialAnalysis />
          </TabsContent>
          <TabsContent value="sales" className="space-y-6">
            <SalesAnalysis />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Analise;
