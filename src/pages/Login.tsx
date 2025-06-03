import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client"; // Não mais necessário diretamente aqui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Eye, EyeOff, Activity, AlertTriangle } from "lucide-react";
import logoImage from "../assets/new-logo-actual.png";
// import { cleanupAuthState } from "@/utils/authUtils"; // Não mais necessário aqui
import { useAuth } from "@/contexts/AuthContext"; // Importar o hook useAuth

const Login = () => {
  // console.log("[Login Page] Component rendering started."); // Logs podem ser removidos ou mantidos

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [loading, setLoading] = useState(false); // Será usado o isAuthenticating do AuthContext
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { login, isAuthenticating, user: authUser, loading: authLoading } = useAuth(); // Usar login e isAuthenticating do contexto

  useEffect(() => {
    // Redireciona se o usuário já estiver logado E o auth não estiver carregando a sessão inicial
    // Isso evita redirecionamento prematuro enquanto o AuthContext carrega a sessão
    if (authUser && !authLoading) {
      console.log("[Login Page] User already authenticated, navigating to dashboard.");
      navigate("/");
    }
  }, [authUser, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // console.log("[Login Page] Attempting signInWithPassword with email:", email);
      await login(email, password); // Chamar a função login do AuthContext
      // O AuthContext e o useEffect acima cuidarão do redirecionamento e estado global
      // toast.success("Login realizado com sucesso!"); // O AuthContext pode mostrar toasts globais ou deixar para o componente
      // A navegação será tratada pelo useEffect acima ou pelo ProtectedRoute
    } catch (err: any) {
      console.error("[Login Page] Catch block in handleLogin, error:", err);
      let errorMessage = "Erro ao fazer login. Verifique suas credenciais.";
      if (err.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou senha inválidos.";
      } else if (err.message?.includes("Email not confirmed")) {
        errorMessage = "Email não confirmado. Verifique sua caixa de entrada.";
      } else if (err.message) { // Pega outras mensagens de erro
        errorMessage = err.message;
      }
      setError(errorMessage);
      // toast.error já é chamado no AuthContext, não precisa duplicar aqui a menos que queira customizar.
    }
    // setLoading(false); // isAuthenticating do AuthContext já lida com isso
  };
  
  // console.log("[Login Page] Before return statement. Current error state:", error);
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Coluna da Esquerda - Logo Centralizada e Formulário */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center p-8 sm:p-12 bg-white/95 shadow-xl min-h-screen">
        <div className="w-full max-w-md flex flex-col items-center justify-center">
          <img src={logoImage} alt="Organização 10x Logo" className="h-36 sm:h-44 md:h-52 lg:h-60 mb-8 drop-shadow-lg" />
          <div className="w-full">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight text-center mb-2">
              Conquiste Seus <span className="text-blue-600">Objetivos</span>
            </h1>
            <p className="mt-2 mb-6 text-gray-600 font-medium text-center">
              Acesse sua plataforma e vamos juntos transformar seu treino e seus resultados.
            </p>
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-50 border-red-300">
                <AlertDescription className="text-red-700 flex items-center">
                  <AlertTriangle size={18} className="mr-2 text-red-600" /> 
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleLogin} className={`space-y-6 transition-all duration-300 ${error ? 'animate-shake' : ''}`}>
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="mt-1 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm bg-white"
                  required 
                  disabled={isAuthenticating}
                />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Senha</Label>
                  <Link to="/recuperar-senha" className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative mt-1">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm pr-10 bg-white"
                    required 
                    disabled={isAuthenticating}
                  />
                  <button 
                    type="button" 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors" 
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    disabled={isAuthenticating}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-base font-bold rounded-md shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
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
                ) : "Entrar"}
              </Button>
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">
                  Não possui uma conta?{" "}
                  <Link to="/registro" className="font-bold text-blue-600 hover:text-blue-800 hover:underline">
                    Registre-se
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Coluna da Direita - Fundo Animado com Formas Geométricas */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-gradient-to-br from-blue-600 via-cyan-400 to-lime-300 flex-col justify-center items-center p-12 text-white relative overflow-hidden">
        {/* Fundo animado com formas geométricas */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Círculo animado */}
          <circle cx="200" cy="150" r="90" fill="#22d3ee" fillOpacity="0.18" className="animate-geom-move1" />
          {/* Quadrado animado */}
          <rect x="550" y="80" width="120" height="120" rx="24" fill="#2563eb" fillOpacity="0.13" className="animate-geom-move2" />
          {/* Triângulo animado */}
          <polygon points="650,500 750,600 550,600" fill="#f59e42" fillOpacity="0.15" className="animate-geom-move3" />
          {/* Círculo menor */}
          <circle cx="700" cy="200" r="40" fill="#facc15" fillOpacity="0.13" className="animate-geom-move4" />
          {/* Quadrado menor */}
          <rect x="100" y="400" width="60" height="60" rx="12" fill="#22d3ee" fillOpacity="0.10" className="animate-geom-move5" />
        </svg>
        {/* Conteúdo motivacional sobreposto */}
        <div className="relative z-10 text-center">
          <Activity size={80} className="mx-auto mb-6 opacity-80" /> 
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Transforme seu Potencial <br/> em Performance.
          </h2>
          <p className="text-lg lg:text-xl opacity-90 max-w-lg mx-auto">
            Junte-se à nossa comunidade e alcance a melhor versão de si mesmo com acompanhamento profissional e personalizado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
