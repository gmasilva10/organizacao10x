import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Layout
import MainLayout from "@/components/layout/MainLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Cadastro from "./pages/Cadastro";
import Onboarding from "./pages/Onboarding";
import Relacionamento from "./pages/Relacionamento";
import Analise from "./pages/Analise";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import RegisterCompleted from "./pages/RegisterCompleted";
import NotFound from "./pages/NotFound";
import ClientProfile from "./pages/ClientProfile";
import Configuracoes from "./pages/Configuracoes";

const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Auth Routes (Public) */}
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/recuperar-senha" element={<ForgotPassword />} />
              <Route path="/registro-concluido" element={<RegisterCompleted />} />
              
              {/* App Routes (Protected) */}
              <Route element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Onboarding />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/relacionamento" element={<Relacionamento />} />
                <Route path="/analise" element={<Analise />} />
                <Route path="/cliente/:clientId" element={<ClientProfile />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
              </Route>
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
