
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ErrorState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="p-8 flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">Cliente não encontrado</h2>
      <Button onClick={() => navigate("/cadastro")}>Voltar para Cadastros</Button>
    </div>
  );
};

export default ErrorState;
