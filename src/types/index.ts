export type AttentionLevel = "high" | "medium" | "low";

export type ClientStatus = "active" | "inactive";

export type ServiceType = "monthly" | "quarterly" | "biannual" | "annual";

export type M0ReferenceType = "payment" | "anamnesis" | "workout";

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  status: string;
  notes?: string;
  attentionLevel?: 'low' | 'medium' | 'high';
  city?: string;
  state?: string;
  country?: string;
  campaignId: string;
  serviceType: string;
  m0Type?: string;
  m0Date?: string;
  createdAt: string;
  updatedAt: string;
  services?: any[];
  last_sale?: {
    client_service_id: string;
    service_id: string;
    service_name: string;
    price: number;
    start_date: string;
    end_date: string;
    payment_method?: string | null;
    installments?: string | null;
    collaborator_id?: string | null;
    payment_date?: string | null;
    status: string;
  };
}

export interface Service {
  service_id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: "active" | "completed";
  conversions?: number;
}

export interface Message {
  id: string;
  code: string; // M1, M2, etc.
  description: string;
  dayOffset: number; // Days since day 0
  content: string;
  objective?: string; // Adicionando objetivo da mensagem
  category?: "Acompanhamento" | "Renovação"; // Adicionando categoria da mensagem
}

export interface ClientMessage {
  id: string;
  clientId: string;
  messageId: string;
  scheduledDate: string;
  sentDate?: string;
  status: "pending" | "sent" | "failed" | "completed";
}

export interface SalesScript {
  id: string;
  name: string;
  date: string;
  whatsappReach: number;
  block1: number;
  block2: number;
  block3: number;
  audio: number;
  text: number;
  purchase: number;
  conversionRate: number;
}

export interface KanbanCard {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  phone?: string;
  content?: string;
  dueDate?: string;
  attentionLevel: AttentionLevel;
  serviceType?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  cards?: KanbanCard[];
}

export interface DashboardMetrics {
  activeClients: {
    count: number;
    changePercentage: number;
  };
  monthlyRevenue: {
    amount: number;
    changePercentage: number;
  };
  newLeads: {
    count: number;
    changePercentage: number;
  };
  renewals: {
    count: number;
    changePercentage: number;
  };
  cancellations: {
    count: number;
    changePercentage: number;
  };
}

export interface TaskMetrics {
  completed: number;
  pending: number;
}

export interface MessageSchedule {
  serviceType: ServiceType;
  durationDays: number;
  messages: {
    code: string;
    dayOffset: number;
    description?: string;
  }[];
}

export type ServiceData = {
  name: string;
  // ... existing code ...
}
