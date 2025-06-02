
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface ConversionDataPoint {
  name: string;
  [key: string]: string | number;
}

interface InteractiveConversionChartProps {
  conversionData: ConversionDataPoint[];
}

const InteractiveConversionChart = ({ conversionData }: InteractiveConversionChartProps) => {
  const [highlightedStage, setHighlightedStage] = useState<string | null>(null);

  const chartConfig = {
    "Lead → B1": { label: "Lead → B1", color: "#3B82F6" },
    "B1 → B2": { label: "B1 → B2", color: "#10B981" },
    "B2 → B3": { label: "B2 → B3", color: "#F59E0B" },
    "B3 → Venda": { label: "B3 → Venda", color: "#EF4444" },
    "Conversão Total": { label: "Conversão Total", color: "#8B5CF6" }
  };

  const getLineOpacity = (dataKey: string) => {
    if (!highlightedStage) return 1;
    return highlightedStage === dataKey ? 1 : 0.3;
  };

  const getLineWidth = (dataKey: string) => {
    if (!highlightedStage) return dataKey === "Conversão Total" ? 4 : 3;
    return highlightedStage === dataKey ? 4 : 2;
  };

  const handleLegendClick = (dataKey: string) => {
    setHighlightedStage(highlightedStage === dataKey ? null : dataKey);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{`Período: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600">{entry.dataKey}:</span>
              </div>
              <span className="font-medium text-gray-800">
                {entry.value.toFixed(2)}%
              </span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Taxa de conversão entre as etapas do funil de vendas
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Taxas de Conversão por Período</CardTitle>
        <p className="text-sm text-gray-600">
          Clique nas etapas da legenda para destacá-las no gráfico
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={conversionData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#ccc" }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#ccc" }}
                domain={[0, 100]}
              />
              <Tooltip 
                content={<CustomTooltip />}
              />
              
              {/* Custom Legend positioned at bottom */}
              <Legend 
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={(entry) => handleLegendClick(entry.dataKey as string)}
              />
              
              <Line 
                type="monotone" 
                dataKey="Lead → B1" 
                stroke={chartConfig["Lead → B1"].color}
                strokeWidth={getLineWidth("Lead → B1")}
                strokeOpacity={getLineOpacity("Lead → B1")}
                dot={{ r: 4, strokeOpacity: getLineOpacity("Lead → B1") }} 
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="B1 → B2" 
                stroke={chartConfig["B1 → B2"].color}
                strokeWidth={getLineWidth("B1 → B2")}
                strokeOpacity={getLineOpacity("B1 → B2")}
                dot={{ r: 4, strokeOpacity: getLineOpacity("B1 → B2") }} 
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="B2 → B3" 
                stroke={chartConfig["B2 → B3"].color}
                strokeWidth={getLineWidth("B2 → B3")}
                strokeOpacity={getLineOpacity("B2 → B3")}
                dot={{ r: 4, strokeOpacity: getLineOpacity("B2 → B3") }} 
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="B3 → Venda" 
                stroke={chartConfig["B3 → Venda"].color}
                strokeWidth={getLineWidth("B3 → Venda")}
                strokeOpacity={getLineOpacity("B3 → Venda")}
                dot={{ r: 4, strokeOpacity: getLineOpacity("B3 → Venda") }} 
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="Conversão Total" 
                stroke={chartConfig["Conversão Total"].color}
                strokeWidth={getLineWidth("Conversão Total")}
                strokeOpacity={getLineOpacity("Conversão Total")}
                dot={{ r: 6, strokeOpacity: getLineOpacity("Conversão Total") }} 
                activeDot={{ r: 8 }}
                strokeDasharray={highlightedStage === "Conversão Total" ? "0" : "5 5"}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveConversionChart;
