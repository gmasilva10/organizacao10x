
export interface ImportStats {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export interface ClientData {
  name: string;
  phone: string;
  cpf: string;
  email: string;
  birthDate: string;
  city?: string;
  state?: string;
  country?: string;
  collaborator?: string;
  clientType?: string;
  service?: string;
  serviceValue?: number;
  paymentMethod?: string;
  installments?: number;
  paymentDate?: string;
  attentionLevel?: string;
  notes?: string;
}
