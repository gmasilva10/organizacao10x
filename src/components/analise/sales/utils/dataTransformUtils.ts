
import { SalesScriptData } from "../types";

// Filter scripts by period
export const filterScriptsByPeriod = (scripts: SalesScriptData[], period: string) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  switch (period) {
    case "last3":
      const last3Months = new Date();
      last3Months.setMonth(currentMonth - 3);
      return scripts.filter(script => {
        const scriptDate = new Date(script.month + " 1, 2025"); // Assuming 2025 for now
        return scriptDate >= last3Months;
      });
      
    case "last6":
      const last6Months = new Date();
      last6Months.setMonth(currentMonth - 6);
      return scripts.filter(script => {
        const scriptDate = new Date(script.month + " 1, 2025");
        return scriptDate >= last6Months;
      });
      
    case "current-year":
      return scripts.filter(script => {
        return script.month.includes(currentYear.toString());
      });
      
    case "all":
    default:
      return scripts;
  }
};

// Prepare data for conversion rates with improved formatting
export const prepareConversionData = (scripts: SalesScriptData[]) => {
  return scripts.map(script => {
    const leadsToBlock1 = parseFloat(((script.block1 / script.leads) * 100).toFixed(2));
    const block1ToBlock2 = parseFloat(((script.block2 / script.block1) * 100).toFixed(2));
    const block2ToBlock3 = parseFloat(((script.block3 / script.block2) * 100).toFixed(2));
    const block3ToSale = parseFloat(((script.sale / script.block3) * 100).toFixed(2));
    const totalConversion = parseFloat(((script.sale / script.leads) * 100).toFixed(2));
    
    return {
      name: script.month,
      "Lead → B1": leadsToBlock1,
      "B1 → B2": block1ToBlock2,
      "B2 → B3": block2ToBlock3,
      "B3 → Venda": block3ToSale,
      "Conversão Total": totalConversion
    };
  });
};

// Calculate average conversions with improved precision
export const calculateAverages = (scripts: SalesScriptData[]) => {
  if (scripts.length === 0) return null;
  
  const totalLeads = scripts.reduce((sum, script) => sum + script.leads, 0);
  const totalBlock1 = scripts.reduce((sum, script) => sum + script.block1, 0);
  const totalBlock2 = scripts.reduce((sum, script) => sum + script.block2, 0);
  const totalBlock3 = scripts.reduce((sum, script) => sum + script.block3, 0);
  const totalSale = scripts.reduce((sum, script) => sum + script.sale, 0);
  const totalConversion = parseFloat(((totalSale / totalLeads) * 100).toFixed(2));
  
  return {
    leads: Math.round(totalLeads / scripts.length),
    block1: Math.round(totalBlock1 / scripts.length),
    block2: Math.round(totalBlock2 / scripts.length),
    block3: Math.round(totalBlock3 / scripts.length),
    audio: Math.round(totalBlock3 / scripts.length), // Using block3 as audio equivalent
    offer: Math.round(totalBlock3 / scripts.length), // B3 is the offer stage
    sale: Math.round(totalSale / scripts.length),
    conversionRate: totalConversion
  };
};

// Prepare data for funnel chart (legacy support)
export const prepareFunnelData = (scripts: SalesScriptData[]) => {
  return scripts.map(script => [
    {
      name: "Lead",
      value: script.leads,
      script: script.month
    },
    {
      name: "B1",
      value: script.block1,
      script: script.month
    },
    {
      name: "B2",
      value: script.block2,
      script: script.month
    },
    {
      name: "B3",
      value: script.block3,
      script: script.month
    },
    {
      name: "Venda",
      value: script.sale,
      script: script.month
    }
  ]);
};

export const prepareChartData = (averages: ReturnType<typeof calculateAverages>) => {
  if (!averages) return [];
  
  return [
    { name: "Lead", value: averages.leads },
    { name: "B1", value: averages.block1 },
    { name: "B2", value: averages.block2 },
    { name: "B3", value: averages.block3 },
    { name: "Venda", value: averages.sale }
  ];
};

// Colors for charts
export const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
];
