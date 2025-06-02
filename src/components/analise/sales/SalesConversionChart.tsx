
import React from "react";
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
import { ConversionDataPoint } from "./types";
import { CHART_COLORS } from "./utils/dataTransformUtils";

interface SalesConversionChartProps {
  conversionData: ConversionDataPoint[];
}

const SalesConversionChart = ({ conversionData }: SalesConversionChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxas de Conversão por Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={conversionData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis 
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, "Taxa de Conversão"]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Lead -> B1" 
                stroke={CHART_COLORS[0]} 
                dot={{ r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="B1 -> B2" 
                stroke={CHART_COLORS[1]} 
                dot={{ r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="B2 -> B3" 
                stroke={CHART_COLORS[2]} 
                dot={{ r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="B3 -> Áudio" 
                stroke={CHART_COLORS[3]} 
                dot={{ r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Áudio -> Oferta" 
                stroke={CHART_COLORS[4]} 
                dot={{ r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Oferta -> Venda" 
                stroke={CHART_COLORS[5]} 
                dot={{ r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Conversão Total" 
                stroke="#ff7300" 
                strokeWidth={3}
                dot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesConversionChart;
