
import React from "react";
import CombinedSalesFunnel from "./CombinedSalesFunnel";
import InteractiveConversionChart from "./InteractiveConversionChart";
import { SalesScriptData, AveragesData } from "./types";

interface SalesChartViewsProps {
  selectedView: string;
  modernFunnelData: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  conversionData: Array<{
    name: string;
    [key: string]: string | number;
  }>;
  filteredScripts: SalesScriptData[];
  averages: AveragesData;
}

const SalesChartViews = ({
  selectedView,
  modernFunnelData,
  conversionData,
  filteredScripts,
  averages
}: SalesChartViewsProps) => {
  if (selectedView === "funnel") {
    return (
      <div className="max-w-5xl mx-auto">
        <CombinedSalesFunnel 
          data={modernFunnelData}
          title="Funil de Conversão Completo"
        />
      </div>
    );
  }

  if (selectedView === "conversion") {
    return (
      <InteractiveConversionChart conversionData={conversionData} />
    );
  }

  return null;
};

export default SalesChartViews;
