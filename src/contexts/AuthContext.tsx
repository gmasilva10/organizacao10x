import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  loginUser as apiLoginUser,
  registerUser as apiRegisterUser,
  logoutUser as apiLogoutUser,
} from "@/services/authService";

interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  organizationName: string;
  documentType: string;
  document: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticating: boolean;
  organization: any | null;
  organizationLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signUp: (userData: RegisterUserData) => Promise<any>;
  signOut: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAuthenticating: false,
  organization: null,
  organizationLoading: true,
  login: async () => { throw new Error("Login function not implemented"); },
  signUp: async () => { throw new Error("SignUp function not implemented"); },
  signOut: async () => {},
  refreshOrganization: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [organization, setOrganization] = useState<any | null>(null);
  const [organizationLoading, setOrganizationLoading] = useState(true);

  useEffect(() => {
    console.log(`%c[AuthTracker] loading state changed: ${loading}`, 'color: orange');
  }, [loading]);

  useEffect(() => {
    console.log(`%c[AuthTracker] organizationLoading state changed: ${organizationLoading}`, 'color: purple');
  }, [organizationLoading]);

  const cleanupAuthState = () => {
    localStorage.removeItem('supabase.auth.token');
    
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const fetchOrganization = async (userId: string) => {
    setOrganizationLoading(true);
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .single();

      if (memberError) {
        console.error("Error fetching organization member:", memberError);
        setOrganization(null);
        return;
      }

      if (memberData?.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('organization_id', memberData.organization_id)
          .single();

        if (orgError) {
          console.error("Error fetching organization:", orgError);
          setOrganization(null);
          return;
        }
        setOrganization(orgData || null);
      } else {
        setOrganization(null);
      }
    } catch (error) {
      console.error("Error in fetchOrganization:", error);
      setOrganization(null);
    } finally {
      setOrganizationLoading(false);
    }
  };

  const refreshOrganization = async () => {
    if (user) {
      await fetchOrganization(user.id);
    } else {
      setOrganization(null);
      setOrganizationLoading(false);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const data = await apiLoginUser(email, password);
      setIsAuthenticating(false);
      return data;
    } catch (error) {
      setIsAuthenticating(false);
      console.error("AuthContext login error:", error);
      toast.error((error as Error).message || "Erro ao fazer login");
      throw error;
    }
  };

  const signUp = async (userData: RegisterUserData) => {
    setIsAuthenticating(true);
    try {
      const result = await apiRegisterUser(userData);
      setIsAuthenticating(false);
      return result;
    } catch (error) {
      setIsAuthenticating(false);
      console.error("AuthContext signUp error:", error);
      toast.error((error as Error).message || "Erro ao criar conta");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { data: { session: currentAuthSession }, error: sessionError } = await supabase.auth.getSession();
      console.log("AuthContext: Session before signOut attempt:", currentAuthSession);
      if (sessionError) {
        console.error("AuthContext: Error getting session before signOut:", sessionError);
      }
      if (!currentAuthSession) {
        console.warn("AuthContext: No active session found by supabase.auth.getSession() before signOut attempt.");
        cleanupAuthState();
        setUser(null);
        setSession(null);
        setOrganization(null);
        setOrganizationLoading(false);
        toast.success("Sessão local limpa (nenhuma sessão ativa no Supabase para invalidar).");
        return;
      }

      await apiLogoutUser(); 
      cleanupAuthState(); 
      setUser(null);
      setSession(null);
      setOrganization(null);
      setOrganizationLoading(false);
      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      console.error("Error signing out:", error); 
      toast.error("Erro ao fazer logout");
      cleanupAuthState(); 
      setUser(null);
      setSession(null);
      setOrganization(null);
      setOrganizationLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      setOrganizationLoading(true);

      const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting initial session:", sessionError);
      }

      if (existingSession?.user) {
        console.log("AuthContext: Initial session found.");
        setSession(existingSession);
        setUser(existingSession.user);
        await fetchOrganization(existingSession.user.id);
      } else {
        console.log("AuthContext: No initial session found.");
        setOrganization(null);
      }
      
      console.log('[AuthTracker] Initial auth check finished. Setting loading states to false.');
      setOrganizationLoading(false);
      setLoading(false);
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        console.log(`%c[AuthTracker] onAuthStateChange triggered. Event: ${_event}`, 'color: blue', currentSession);
        
        const currentUser = currentSession?.user ?? null;
        const previousUser = user;

        if (currentUser?.id !== previousUser?.id) {
          setSession(currentSession);
          setUser(currentUser);

          if (currentUser) {
            console.log('[AuthTracker] User found in onAuthStateChange, fetching organization.');
            await fetchOrganization(currentUser.id);
          } else {
            console.log('[AuthTracker] No user in onAuthStateChange, clearing organization.');
            setOrganization(null);
            setOrganizationLoading(false);
          }
        }
        console.log('[AuthTracker] onAuthStateChange finished. Setting loading to false.');
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, isAuthenticating, organization, organizationLoading, login, signUp, signOut, refreshOrganization }}>
      {children}
    </AuthContext.Provider>
  );
};
