
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthYearSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MonthYearSelect = ({ value, onChange, disabled }: MonthYearSelectProps) => {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 2050 - currentYear + 1 }, (_, i) => currentYear + i);

  // Generate all month/year combinations
  const monthYearOptions = years.flatMap(year => 
    months.map(month => ({
      value: `${month}/${year}`,
      label: `${month} ${year}`
    }))
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="monthYear">Mês/Ano</Label>
      <Select 
        value={value} 
        onValueChange={onChange} 
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o mês e ano" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectGroup>
            {monthYearOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default MonthYearSelect;
