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
  const { name, email, password, organizationName } = userData;
  
  console.log("Iniciando processo de registro no authService (lógica refatorada)");

  // 1. Criar o usuário no Auth
  console.log("Tentando criar usuário no Supabase Auth");
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name, // Mapeando para 'full_name' no profiles
      }
    }
  });
  
  if (authError) {
    console.error("Erro na criação do usuário no Auth:", authError);
    throw authError;
  }
  if (!authData.user) {
    console.error("Não foi possível obter dados do usuário após registro");
    throw new Error("Falha no registro: usuário não retornado");
  }
  const userId = authData.user.id;
  console.log("Usuário criado com sucesso no Auth:", userId);

  // O trigger 'on_auth_user_created' ainda cuidará da criação do perfil básico.
  // A lógica a seguir garante a criação e associação da organização de forma explícita.

  let organizationId: string | null = null;

  try {
    // 2. Criar a Organização
    console.log("Criando organização explicitamente:", organizationName);
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        owner_id: userId,
      })
      .select('organization_id')
      .single();

    if (orgError) {
      console.error("Erro ao inserir na tabela 'organizations':", orgError);
      throw orgError;
    }
    if (!orgData?.organization_id) {
      throw new Error("Falha ao criar organização: ID não retornado.");
    }
    organizationId = orgData.organization_id;
    console.log("Organização criada com sucesso:", organizationId);

    // 3. Associar o usuário à organização como admin
    console.log("Associando usuário à organização como admin...");
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role: 'admin' // Definindo o criador como admin
      });

    if (memberError) {
      console.error("Erro ao inserir na tabela 'organization_members':", memberError);
      throw memberError;
    }
    console.log("Usuário associado à organização com sucesso.");
    
    return {
      user: authData.user,
      organization: { organization_id: organizationId }
    };
  } catch (err) {
    console.error("Erro no processo de criação de organização/associação:", err);
    // TODO: Adicionar lógica de cleanup se necessário (ex: deletar a organização se a associação falhar)
    // No momento, o RLS impediria a deleção do usuário do Auth por aqui, o que é o comportamento esperado.
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
