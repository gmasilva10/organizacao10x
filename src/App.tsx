import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Suspense, lazy } from "react";

// Layout
import MainLayout from "@/components/layout/MainLayout";

// Lazy-loaded Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Relacionamento = lazy(() => import("./pages/Relacionamento"));
const Analise = lazy(() => import("./pages/Analise"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const RegisterCompleted = lazy(() => import("./pages/RegisterCompleted"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ClientProfile = lazy(() => import("./pages/ClientProfile"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </TooltipProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
