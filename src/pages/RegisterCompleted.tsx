import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import logoImage from "../assets/brain-logo-actual.png";

const RegisterCompleted = () => {
  return <div className="min-h-screen flex items-center justify-center bg-[#f0f8ff]">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Organização 10x Logo" className="h-16" />
          </div>
          <h1 className="text-3xl font-bold text-[#0C6CA1]">Organização 10x</h1>
        </div>
        
        <div className="bg-white p-8 shadow-sm rounded-lg text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h1 className="mt-4 text-xl font-bold text-gray-900">Registro Concluído!</h1>
            <p className="mt-2 text-gray-600">
              Enviamos um email de confirmação para o endereço fornecido. Por favor, verifique sua caixa de entrada e
              confirme sua conta.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-blue-800 text-sm">
              Não recebeu o email? Verifique sua pasta de spam ou solicite um novo email de confirmação.
            </p>
          </div>
          
          <Button asChild className="w-full mb-4 bg-[#0C9EDF] hover:bg-[#0987c1] text-white">
            <Link to="/login">Voltar para o Login</Link>
          </Button>
          
          <button className="text-[#0C9EDF] hover:underline text-sm font-medium">
            Reenviar email de confirmação
          </button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            &copy; 2025 Organização 10x. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>;
};
export default RegisterCompleted;
