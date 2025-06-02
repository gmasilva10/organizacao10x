
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface NumericInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const NumericInput = ({ id, label, value, onChange, disabled }: NumericInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input 
        id={id} 
        type="number" 
        min="0" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={disabled}
      />
    </div>
  );
};

export default NumericInput;
