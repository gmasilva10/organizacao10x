
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserInfoFormProps {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
}

export const UserInfoForm = ({ name, setName, email, setEmail }: UserInfoFormProps) => {
  return (
    <>
      <div className="mb-4">
        <Label htmlFor="name">Nome completo</Label>
        <Input 
          id="name" 
          type="text" 
          placeholder="Seu nome completo" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="mt-1" 
          required 
        />
      </div>
      
      <div className="mb-4">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="seu@email.com" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          className="mt-1" 
          required 
        />
      </div>
    </>
  );
};
