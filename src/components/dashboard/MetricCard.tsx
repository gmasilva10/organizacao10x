
import React, { useMemo } from "react";
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

const MetricCard = React.memo(({
  title,
  value,
  changePercentage,
  icon,
  format = "number",
  className
}: MetricCardProps) => {
  const isPositive = changePercentage && changePercentage > 0;
  const isNegative = changePercentage && changePercentage < 0;
  
  const formattedValue = useMemo(() => {
    return format === "currency" 
      ? `R$ ${typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}`
      : value;
  }, [value, format]);

  return (
    <div className={cn("bg-white rounded-lg p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
            {icon}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{title}</p>
            <p className="text-xl font-bold text-gray-900">{formattedValue}</p>
          </div>
        </div>
        
        {changePercentage !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            isPositive && "bg-green-50 text-green-700",
            isNegative && "bg-red-50 text-red-700",
            !isPositive && !isNegative && "bg-gray-50 text-gray-700"
          )}>
            {isPositive && <ArrowUp size={12} />}
            {isNegative && <ArrowDown size={12} />}
            {Math.abs(changePercentage)}%
          </div>
        )}
      </div>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

export default MetricCard;
