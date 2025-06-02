
import React, { useState } from "react";
import { useScriptData } from "./sales/useScriptData";
import { 
  prepareFunnelData,
  prepareConversionData, 
  calculateAverages,
  filterScriptsByPeriod
} from "./sales/utils/dataTransformUtils";
import TimeFilter from "./TimeFilter";
import SalesKPICards from "./sales/SalesKPICards";
import SalesViewSelector from "./sales/SalesViewSelector";
import SalesChartViews from "./sales/SalesChartViews";

const SalesAnalysis = () => {
  const { monthlyScripts, loading } = useScriptData();
  const [selectedView, setSelectedView] = useState("funnel");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  if (monthlyScripts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">
          Nenhum script de vendas encontrado. Adicione scripts na aba "Script de Vendas" em Gerenciamento.
        </div>
      </div>
    );
  }
  
  // Filter data based on selected period
  const filteredScripts = filterScriptsByPeriod(monthlyScripts, selectedPeriod);
  
  // Calculate all the data
  const funnelData = prepareFunnelData(filteredScripts);
  const conversionData = prepareConversionData(filteredScripts);
  const averages = calculateAverages(filteredScripts);
  
  if (!averages) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Sem dados disponíveis para análise.</div>
      </div>
    );
  }

  // Enhanced funnel data with colors and percentages (fixed calculations)
  const modernFunnelData = [
    { 
      name: "Leads Iniciais", 
      value: averages.leads, 
      percentage: 100.00,
      color: "#3B82F6"
    },
    { 
      name: "B1 - Diagnóstico", 
      value: averages.block1, 
      percentage: parseFloat(((averages.block1 / averages.leads) * 100).toFixed(2)),
      color: "#10B981"
    },
    { 
      name: "B2 - Diferenciação", 
      value: averages.block2, 
      percentage: parseFloat(((averages.block2 / averages.leads) * 100).toFixed(2)),
      color: "#F59E0B"
    },
    { 
      name: "B3 - Oferta", 
      value: averages.block3, 
      percentage: parseFloat(((averages.block3 / averages.leads) * 100).toFixed(2)),
      color: "#EF4444"
    },
    { 
      name: "Venda", 
      value: averages.sale, 
      percentage: parseFloat(((averages.sale / averages.leads) * 100).toFixed(2)),
      color: "#06B6D4"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Time Filter */}
      <TimeFilter 
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      {/* KPI Cards */}
      <SalesKPICards 
        averages={averages}
        scriptCount={filteredScripts.length}
      />

      {/* View Selection */}
      <SalesViewSelector 
        selectedView={selectedView}
        onViewChange={setSelectedView}
      />
      
      {/* Main Visualizations */}
      <SalesChartViews
        selectedView={selectedView}
        modernFunnelData={modernFunnelData}
        conversionData={conversionData}
        filteredScripts={filteredScripts}
        averages={averages}
      />
    </div>
  );
};

export default SalesAnalysis;
