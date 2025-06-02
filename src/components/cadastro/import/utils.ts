
import { states } from "@/services/mockData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const validateRequiredFields = (client: any): string[] => {
  const errors: string[] = [];
  
  if (!client["Nome do Aluno*"]) errors.push("Nome");
  if (!client["Telefone*"]) errors.push("Telefone");
  if (!client["CPF*"]) errors.push("CPF");
  if (!client["E-mail*"]) errors.push("E-mail");
  if (!client["Data de Nascimento*"]) errors.push("Data de Nascimento");
  
  return errors;
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove non-numeric characters
  return phone.replace(/\D/g, '');
};

export const formatCpf = (cpf: string): string => {
  // Remove non-numeric characters
  return cpf.replace(/\D/g, '');
};

export const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  
  try {
    // Try to parse DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      const year = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      
      // Return ISO format for database
      return date.toISOString().split('T')[0];
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const validateStateCode = (stateCode: string): boolean => {
  if (!stateCode) return true; // Optional field
  return states.includes(stateCode);
};

export const processAttentionLevel = (level: string): "low" | "medium" | "high" | null => {
  if (!level) return null;
  
  const normalizedLevel = level.toLowerCase().trim();
  
  if (normalizedLevel === "baixo" || normalizedLevel === "baixa") return "low";
  if (normalizedLevel === "médio" || normalizedLevel === "média" || normalizedLevel === "medio") return "medium";
  if (normalizedLevel === "alto" || normalizedLevel === "alta") return "high";
  
  return null;
};

export const getCurrentOrganizationId = async (): Promise<string | null> => {
  try {
    // Get the current user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData?.session?.user) {
      console.error("Erro de sessão:", sessionError?.message || "Sessão não encontrada");
      toast.error("Erro de autenticação", {
        description: "Você precisa estar autenticado para realizar esta operação."
      });
      return null;
    }

    const userId = sessionData.session.user.id;
    console.log("User ID encontrado:", userId);

    // Fetch organization member directly
    const { data: orgMember, error: orgMemberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', userId)
      .single();
    
    if (orgMemberError) {
      console.error("Erro ao buscar membro da organização:", orgMemberError.message);
      toast.error("Erro de organização", {
        description: "Não foi possível encontrar sua organização. Por favor, contate o suporte."
      });
      return null;
    }
    
    if (!orgMember?.organization_id) {
      console.error("Membro da organização não encontrado para o usuário:", userId);
      toast.error("Erro de organização", {
        description: "Você não está associado a nenhuma organização. Por favor, contate o suporte."
      });
      return null;
    }

    console.log("Organization ID encontrado:", orgMember.organization_id);
    return orgMember.organization_id;
    
  } catch (error) {
    console.error("Erro ao obter ID da organização:", error);
    toast.error("Erro inesperado", {
      description: "Ocorreu um erro ao buscar suas informações. Por favor, tente novamente."
    });
    return null;
  }
};

export const importClientToDatabase = async (clientData: any) => {
  // Get current organization ID
  const organizationId = await getCurrentOrganizationId();
  
  if (!organizationId) {
    throw new Error("Não foi possível determinar a organização atual. Verifique se você está autenticado e associado a uma organização.");
  }
  
  // Format and prepare client data for insertion
  const formattedData = {
    client_name: clientData["Nome do Aluno*"],
    client_phone: formatPhoneNumber(clientData["Telefone*"]),
    client_cpf: formatCpf(clientData["CPF*"]),
    client_email: clientData["E-mail*"],
    client_birth_date: parseDate(clientData["Data de Nascimento*"]),
    client_city: clientData["Cidade"] || null,
    client_state: clientData["Estado"] || null,
    client_country: clientData["País"] || "Brasil",
    client_attention_level: processAttentionLevel(clientData["Nível de Atenção"]),
    client_notes: clientData["Observações"] || null,
    client_status: "active",
    organization_id: organizationId
  };

  console.log("Tentando inserir cliente com dados:", formattedData);

  // Insert client into database
  const { error } = await supabase
    .from('clients')
    .insert([formattedData]);
  
  if (error) {
    console.error("Erro na inserção do cliente:", error);
    throw new Error(`Erro de banco de dados: ${error.message}`);
  }
  
  return { success: true };
};
