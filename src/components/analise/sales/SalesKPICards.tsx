
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Percent, Users } from "lucide-react";
import { AveragesData } from "./types";

interface SalesKPICardsProps {
  averages: AveragesData;
  scriptCount: number;
}

const SalesKPICards = ({ averages, scriptCount }: SalesKPICardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leads Médios</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averages.leads}</div>
          <p className="text-xs text-muted-foreground">
            Base de {scriptCount} scripts
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversão Final</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {averages.conversionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {averages.sale} vendas de {averages.leads} leads
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas Médias</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averages.sale}</div>
          <p className="text-xs text-muted-foreground">
            Por período analisado
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Maior Perda</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            Lead → B1
          </div>
          <p className="text-xs text-muted-foreground">
            {((1 - averages.block1 / averages.leads) * 100).toFixed(1)}% de perda
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesKPICards;
