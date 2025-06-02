
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { ChartDataPoint } from "./types";

interface SalesFunnelChartProps {
  chartData: ChartDataPoint[];
}

const SalesFunnelChart = ({ chartData }: SalesFunnelChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Vendas Médio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 80, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 12 }}
                width={70}
              />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="value" 
                name="Quantidade" 
                fill="#8884d8" 
                background={{ fill: "#eee" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesFunnelChart;
