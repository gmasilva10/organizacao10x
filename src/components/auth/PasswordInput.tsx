
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minLength?: number;
  required?: boolean;
}

export const PasswordInput = ({ id, label, value, onChange, minLength = 6, required = true }: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="mb-4">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input 
          id={id} 
          type={showPassword ? "text" : "password"} 
          placeholder="********" 
          value={value} 
          onChange={onChange} 
          className="mt-1 pr-10" 
          minLength={minLength}
          required={required}
        />
        <button 
          type="button" 
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 mt-1"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};
