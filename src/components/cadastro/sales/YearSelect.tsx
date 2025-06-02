
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

interface YearSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const YearSelect = ({ value, onChange, disabled }: YearSelectProps) => {
  const years = Array.from({ length: 2030 - 2020 + 1 }, (_, i) => 2020 + i);

  return (
    <div className="space-y-2">
      <Label htmlFor="year">Ano</Label>
      <Select 
        value={value} 
        onValueChange={onChange} 
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o ano" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectGroup>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default YearSelect;
