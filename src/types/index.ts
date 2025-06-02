export type AttentionLevel = "high" | "medium" | "low";

export type ClientStatus = "active" | "inactive";

export type ServiceType = "monthly" | "quarterly" | "biannual" | "annual";

export type M0ReferenceType = "payment" | "anamnesis" | "workout";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  city?: string;
  state?: string;
  country?: string;
  birthDate?: string;
  attentionLevel: AttentionLevel;
  status: ClientStatus;
  serviceType: ServiceType;
  campaignId: string;
  startDate: string;
  endDate: string;
  value?: number;
  notes?: string;
  anamnesisDate?: string | null;
  workoutDeliveryDate?: string | null;
  m0ReferenceType?: M0ReferenceType;
  m0Date?: string | null;
}

export interface Service {
  service_id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  duration_months?: number | null;
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
