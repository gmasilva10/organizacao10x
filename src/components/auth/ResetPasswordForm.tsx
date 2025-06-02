
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cleanupAuthState } from "@/utils/authUtils";

interface ResetPasswordFormProps {
  email: string;
  setEmail: (email: string) => void;
}

export const ResetPasswordForm = ({ email, setEmail }: ResetPasswordFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    
    try {
      // Clean up auth state before requesting password reset
      cleanupAuthState();
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });
      
      if (error) throw error;
      
      setSuccess(true);
      toast.success("Email de recuperação enviado com sucesso!");
    } catch (error: any) {
      console.error("Password reset error:", error);

      // Mensagens de erro em português
      let errorMessage = "Erro ao enviar email de recuperação. Tente novamente.";
      if (error.message?.includes("not found")) {
        errorMessage = "Email não encontrado.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">
            Enviamos um email de recuperação para {email}. Por favor, verifique sua caixa de entrada.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setSuccess(false)} variant="outline" className="mr-2">
          Tentar novamente
        </Button>
        <Link to="/login">
          <Button className="bg-[#0C9EDF] hover:bg-[#0987c1] text-white">
            Voltar para o login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleResetPassword}>
      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <Label htmlFor="email">Email</Label>
        <p className="text-sm text-gray-600 mb-2">
          Digite seu email de cadastro para receber um link de recuperação de senha.
        </p>
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
      
      <Button 
        type="submit" 
        className="w-full bg-[#0C9EDF] hover:bg-[#0987c1] text-white" 
        disabled={loading}
      >
        {loading ? "Enviando..." : "Enviar link de recuperação"}
      </Button>
      
      <div className="mt-4 text-center text-sm">
        <Link to="/login" className="text-[#0C9EDF] font-medium hover:underline">
          Voltar para o login
        </Link>
      </div>
    </form>
  );
};
