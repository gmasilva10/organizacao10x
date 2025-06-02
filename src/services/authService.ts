import { supabase } from "@/integrations/supabase/client";

interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  organizationName: string;
  documentType: string;
  document: string;
}

export const registerUser = async (userData: RegisterUserData) => {
  const { name, email, password, organizationName, documentType, document } = userData;
  
  console.log("Iniciando processo de registro no authService");

  try {
    // Sign up the user
    console.log("Tentando criar usuário no Supabase Auth");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          organization_name: organizationName,
          document_type: documentType,
          document: document
        }
      }
    });
    
    if (error) {
      console.error("Erro na criação do usuário:", error);
      throw error;
    }
    
    if (!data.user) {
      console.error("Não foi possível obter dados do usuário após registro");
      throw new Error("Falha no registro: usuário não retornado");
    }
    
    console.log("Usuário criado com sucesso:", data.user.id);
    
    // The trigger 'on_auth_user_created' and function 'handle_new_user' 
    // will now automatically create a profile entry in public.profiles.

    // Re-adding a short delay to allow the profile creation trigger to complete and commit
    console.log("Perfil deve ter sido criado pelo trigger. Aguardando 2 segundos para consistência transacional...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
    console.log("Atraso para consistência do perfil concluído.");

    // Create the organization using an RPC function
    console.log("Criando organização via RPC:", organizationName);
    const { data: rpcOrgData, error: rpcOrgError } = await supabase
      .rpc('create_new_organization', { 
        org_name: organizationName,
        user_id_input: data.user.id
      });

    if (rpcOrgError) {
      console.error("Erro ao criar organização via RPC:", rpcOrgError);
      throw rpcOrgError;
    }

    if (!rpcOrgData) { // RPC pode retornar null ou o ID diretamente dependendo da definição
      console.error("Não foi possível obter o ID da organização após chamada RPC.");
      throw new Error("Falha ao criar organização: ID não retornado pela RPC.");
    }
    const newOrganizationId = rpcOrgData; // Assumindo que a RPC retorna o UUID diretamente
    console.log("Organização criada com sucesso via RPC, ID:", newOrganizationId);
    
    return {
      user: data.user,
      organization: { organization_id: newOrganizationId }
    };
  } catch (err) {
    console.error("Erro no processo de criação de organização/perfil:", err);
    
    // Se ocorrer um erro após a criação do usuário, tentamos limpá-lo
    try {
      console.log("Tentando excluir o usuário criado devido a erro no processo");
      // Infelizmente não podemos deletar usuários via API cliente, então vamos apenas registrar o erro
      console.log("Nota: O usuário foi criado, mas ocorreu um erro ao configurar a organização");
    } catch (cleanupError) {
      console.error("Erro ao limpar usuário após falha:", cleanupError);
    }
    
    throw err;
  }
};

export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/redefinir-senha'
  });
  
  if (error) throw error;
};

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) throw error;
};
