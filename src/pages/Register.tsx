import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client"; // Não mais necessário diretamente aqui
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { OrganizationInfoForm } from "@/components/auth/OrganizationInfoForm";
import { UserInfoForm } from "@/components/auth/UserInfoForm";
import { PasswordInput } from "@/components/auth/PasswordInput";
// import { registerUser } from "@/services/authService"; // Será usado via AuthContext
// import { cleanupAuthState } from "@/utils/authUtils"; // Não mais necessário aqui
import { useAuth } from "@/contexts/AuthContext"; // Importar o hook useAuth
import logoImage from "../assets/brain-logo-actual.png";
// import { zodResolver } from "@hookform/resolvers/zod"; // Não parece estar sendo usado

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [documentType, setDocumentType] = useState("CPF"); // Valor padrão
  const [document, setDocument] = useState("");
  // const [loading, setLoading] = useState(false); // Será usado isAuthenticating do AuthContext
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { signUp, isAuthenticating, user: authUser, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authUser && !authLoading) {
      console.log("[Register Page] User already authenticated, navigating to dashboard.");
      navigate("/"); // Ou para onde um usuário já logado deve ir ao tentar registrar
    }
  }, [authUser, authLoading, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !confirmPassword || !organizationName || !documentType || !document) {
      setError("Todos os campos são obrigatórios.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email inválido.");
      return;
    }
    
    try {
      // console.log("Iniciando processo de registro no componente Register");
      await signUp({ 
        name,
        email,
        password,
        organizationName,
        documentType,
        document
      });
      // console.log("Registro no componente concluído com sucesso:", result);
      toast.success("Registro realizado com sucesso! Verifique seu e-mail para confirmação."); // Toast local pode ser mais específico
      navigate("/registro-concluido"); // Ou o AuthContext/ProtectedRoute lida com isso
    } catch (error: any) {
      console.error("Erro detalhado de registro no componente:", error);
      let errorMessage = "Erro ao criar conta. Tente novamente.";
      if (error.message?.includes("already registered")) {
        errorMessage = "Este email já está cadastrado.";
      } else if (error.message?.includes("weak password")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      // toast.error já é chamado no AuthContext, não precisa duplicar
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f8ff] py-8">
      <div className="w-full max-w-md px-4">
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Organização 10x Logo" className="h-16" />
          </div>
          <h1 className="text-3xl font-bold text-[#0C6CA1]">Organização 10x</h1>
          <p className="mt-1 text-gray-600">Crie sua conta para começar</p>
        </div>
        
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="text-2xl font-semibold mb-1">Registro</h2>
          <p className="text-sm text-gray-600 mb-6">Preencha os campos abaixo para criar sua conta de administrador</p>
          
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleRegister} className="space-y-4">
            <OrganizationInfoForm 
              organizationName={organizationName}
              setOrganizationName={setOrganizationName}
              documentType={documentType}
              setDocumentType={setDocumentType}
              document={document}
              setDocument={setDocument}
              disabled={isAuthenticating}
            />
            
            <UserInfoForm 
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              disabled={isAuthenticating}
            />
            
            <PasswordInput 
              id="password"
              label="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isAuthenticating}
            />
            
            <PasswordInput 
              id="confirmPassword"
              label="Confirmar senha"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isAuthenticating}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-[#0C9EDF] hover:bg-[#0987c1] text-white" 
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <div className="flex items-center justify-center">
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </div>
              ) : "Criar Conta"}
            </Button>
            
            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">
                Já possui uma conta?{" "}
                <Link to="/login" className="text-[#0C9EDF] font-medium hover:underline">
                  Faça login
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
