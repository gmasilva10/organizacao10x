
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Filter } from "lucide-react";

interface TimeFilterProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

const TimeFilter = ({ selectedPeriod, onPeriodChange }: TimeFilterProps) => {
  const periods = [
    { id: "all", label: "Todos os Períodos" },
    { id: "last3", label: "Últimos 3 Meses" },
    { id: "last6", label: "Últimos 6 Meses" },
    { id: "current-year", label: "Ano Atual" },
    { id: "custom", label: "Personalizado" }
  ];

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Filtrar por Período:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {periods.map((period) => (
              <Button
                key={period.id}
                variant={selectedPeriod === period.id ? "default" : "outline"}
                size="sm"
                onClick={() => onPeriodChange(period.id)}
                className={`text-xs ${
                  selectedPeriod === period.id 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "border-blue-200 text-blue-600 hover:bg-blue-50"
                }`}
              >
                {period.id === "custom" && <Calendar className="h-3 w-3 mr-1" />}
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeFilter;
