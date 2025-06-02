
import { supabase } from "@/integrations/supabase/client";

/**
 * Clean up auth state before registration or login
 */
export const cleanupAuthState = () => {
  console.log("Iniciando limpeza de estado de autenticação");
  
  try {
    // Remove standard auth tokens
    localStorage.removeItem('supabase.auth.token');
    
    // Remove all Supabase auth keys from localStorage
    const localStorageKeys = Object.keys(localStorage);
    console.log("Total de chaves no localStorage:", localStorageKeys.length);
    
    localStorageKeys.forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        console.log(`Removendo chave do localStorage: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Remove from sessionStorage if in use
    if (typeof sessionStorage !== 'undefined') {
      const sessionStorageKeys = Object.keys(sessionStorage || {});
      console.log("Total de chaves no sessionStorage:", sessionStorageKeys.length);
      
      sessionStorageKeys.forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          console.log(`Removendo chave do sessionStorage: ${key}`);
          sessionStorage.removeItem(key);
        }
      });
    }
    
    console.log("Limpeza de estado de autenticação concluída");
  } catch (error) {
    console.error("Erro durante limpeza de estado de autenticação:", error);
  }
};

/**
 * Verifica se um usuário está autenticado
 */
export const isAuthenticated = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};
