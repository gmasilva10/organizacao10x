
import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  changePercentage?: number;
  icon: React.ReactNode;
  format?: string;
  className?: string;
}

const MetricCard = ({
  title,
  value,
  changePercentage,
  icon,
  format = "number",
  className
}: MetricCardProps) => {
  const isPositive = changePercentage && changePercentage > 0;
  const isNegative = changePercentage && changePercentage < 0;
  const formattedValue = format === "currency" 
    ? `R$ ${typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}`
    : value;

  return (
    <div className={cn("bg-white rounded-lg p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{formattedValue}</h3>
        </div>
        <div className={cn(
          "p-3 rounded-full",
          title === "Clientes Ativos" && "bg-blue-100 text-blue-600",
          title === "Faturamento no Mês" && "bg-green-100 text-green-600",
          title === "Novos Leads no Mês" && "bg-purple-100 text-purple-600",
          title === "Renovações no Mês" && "bg-yellow-100 text-yellow-600",
          title === "Cancelamentos no Mês" && "bg-red-100 text-red-600",
        )}>
          {icon}
        </div>
      </div>
      
      {changePercentage !== undefined && (
        <div className="mt-2 flex items-center">
          {isPositive ? (
            <ArrowUp size={14} className="mr-1 text-green-500" />
          ) : isNegative ? (
            <ArrowDown size={14} className="mr-1 text-red-500" />
          ) : null}
          <span className={cn(
            "text-xs font-medium",
            isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-gray-500"
          )}>
            {Math.abs(changePercentage).toFixed(1)}% em relação ao mês anterior
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
