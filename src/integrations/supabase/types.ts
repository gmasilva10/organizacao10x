export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: {
          campaign_conversions: number | null
          campaign_created_at: string | null
          campaign_description: string | null
          campaign_end_date: string | null
          campaign_id: string
          campaign_name: string
          campaign_start_date: string | null
          campaign_status: string | null
          campaign_updated_at: string | null
          organization_id: string | null
        }
        Insert: {
          campaign_conversions?: number | null
          campaign_created_at?: string | null
          campaign_description?: string | null
          campaign_end_date?: string | null
          campaign_id?: string
          campaign_name: string
          campaign_start_date?: string | null
          campaign_status?: string | null
          campaign_updated_at?: string | null
          organization_id?: string | null
        }
        Update: {
          campaign_conversions?: number | null
          campaign_created_at?: string | null
          campaign_description?: string | null
          campaign_end_date?: string | null
          campaign_id?: string
          campaign_name?: string
          campaign_start_date?: string | null
          campaign_status?: string | null
          campaign_updated_at?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      client_messages: {
        Row: {
          client_id: string | null
          client_message_created_at: string | null
          client_message_id: string
          client_message_scheduled_date: string
          client_message_sent_date: string | null
          client_message_status: string | null
          client_message_updated_at: string | null
          message_template_id: string | null
        }
        Insert: {
          client_id?: string | null
          client_message_created_at?: string | null
          client_message_id?: string
          client_message_scheduled_date: string
          client_message_sent_date?: string | null
          client_message_status?: string | null
          client_message_updated_at?: string | null
          message_template_id?: string | null
        }
        Update: {
          client_id?: string | null
          client_message_created_at?: string | null
          client_message_id?: string
          client_message_scheduled_date?: string
          client_message_sent_date?: string | null
          client_message_status?: string | null
          client_message_updated_at?: string | null
          message_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_messages_message_template_id_fkey"
            columns: ["message_template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["message_template_id"]
          },
        ]
      }
      client_services: {
        Row: {
          campaign_id: string | null
          client_id: string | null
          client_service_created_at: string | null
          client_service_end_date: string
          client_service_id: string
          client_service_start_date: string
          client_service_status: string | null
          client_service_updated_at: string | null
          client_service_value: number
          service_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          client_id?: string | null
          client_service_created_at?: string | null
          client_service_end_date: string
          client_service_id?: string
          client_service_start_date: string
          client_service_status?: string | null
          client_service_updated_at?: string | null
          client_service_value: number
          service_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          client_id?: string | null
          client_service_created_at?: string | null
          client_service_end_date?: string
          client_service_id?: string
          client_service_start_date?: string
          client_service_status?: string | null
          client_service_updated_at?: string | null
          client_service_value?: number
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["service_id"]
          },
        ]
      }
      clients: {
        Row: {
          client_anamnesis_date: string | null
          client_attention_level: string | null
          client_birth_date: string | null
          client_city: string | null
          client_country: string | null
          client_cpf: string | null
          client_created_at: string | null
          client_email: string
          client_id: string
          client_m0_date: string | null
          client_m0_reference_type: string | null
          client_m0_type: string | null
          client_name: string
          client_notes: string | null
          client_phone: string
          client_state: string | null
          client_status: string | null
          client_updated_at: string | null
          client_workout_delivery_date: string | null
          organization_id: string | null
        }
        Insert: {
          client_anamnesis_date?: string | null
          client_attention_level?: string | null
          client_birth_date?: string | null
          client_city?: string | null
          client_country?: string | null
          client_cpf?: string | null
          client_created_at?: string | null
          client_email: string
          client_id?: string
          client_m0_date?: string | null
          client_m0_reference_type?: string | null
          client_m0_type?: string | null
          client_name: string
          client_notes?: string | null
          client_phone: string
          client_state?: string | null
          client_status?: string | null
          client_updated_at?: string | null
          client_workout_delivery_date?: string | null
          organization_id?: string | null
        }
        Update: {
          client_anamnesis_date?: string | null
          client_attention_level?: string | null
          client_birth_date?: string | null
          client_city?: string | null
          client_country?: string | null
          client_cpf?: string | null
          client_created_at?: string | null
          client_email?: string
          client_id?: string
          client_m0_date?: string | null
          client_m0_reference_type?: string | null
          client_m0_type?: string | null
          client_name?: string
          client_notes?: string | null
          client_phone?: string
          client_state?: string | null
          client_status?: string | null
          client_updated_at?: string | null
          client_workout_delivery_date?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      kanban_cards: {
        Row: {
          client_id: string | null
          kanban_card_attention_level: string | null
          kanban_card_content: string | null
          kanban_card_created_at: string | null
          kanban_card_due_date: string | null
          kanban_card_id: string
          kanban_card_updated_at: string | null
          kanban_column_id: string | null
        }
        Insert: {
          client_id?: string | null
          kanban_card_attention_level?: string | null
          kanban_card_content?: string | null
          kanban_card_created_at?: string | null
          kanban_card_due_date?: string | null
          kanban_card_id?: string
          kanban_card_updated_at?: string | null
          kanban_column_id?: string | null
        }
        Update: {
          client_id?: string | null
          kanban_card_attention_level?: string | null
          kanban_card_content?: string | null
          kanban_card_created_at?: string | null
          kanban_card_due_date?: string | null
          kanban_card_id?: string
          kanban_card_updated_at?: string | null
          kanban_column_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_cards_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "kanban_cards_kanban_column_id_fkey"
            columns: ["kanban_column_id"]
            isOneToOne: false
            referencedRelation: "kanban_columns"
            referencedColumns: ["kanban_column_id"]
          },
        ]
      }
      kanban_columns: {
        Row: {
          kanban_column_color: string
          kanban_column_created_at: string | null
          kanban_column_id: string
          kanban_column_order: number
          kanban_column_title: string
          kanban_column_updated_at: string | null
          organization_id: string | null
        }
        Insert: {
          kanban_column_color: string
          kanban_column_created_at?: string | null
          kanban_column_id?: string
          kanban_column_order: number
          kanban_column_title: string
          kanban_column_updated_at?: string | null
          organization_id?: string | null
        }
        Update: {
          kanban_column_color?: string
          kanban_column_created_at?: string | null
          kanban_column_id?: string
          kanban_column_order?: number
          kanban_column_title?: string
          kanban_column_updated_at?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_columns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      message_templates: {
        Row: {
          message_template_category: string | null
          message_template_code: string
          message_template_content: string
          message_template_created_at: string | null
          message_template_day_offset: number
          message_template_description: string
          message_template_id: string
          message_template_objective: string | null
          message_template_updated_at: string | null
          organization_id: string | null
        }
        Insert: {
          message_template_category?: string | null
          message_template_code: string
          message_template_content: string
          message_template_created_at?: string | null
          message_template_day_offset: number
          message_template_description: string
          message_template_id?: string
          message_template_objective?: string | null
          message_template_updated_at?: string | null
          organization_id?: string | null
        }
        Update: {
          message_template_category?: string | null
          message_template_code?: string
          message_template_content?: string
          message_template_created_at?: string | null
          message_template_day_offset?: number
          message_template_description?: string
          message_template_id?: string
          message_template_objective?: string | null
          message_template_updated_at?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_members: {
        Row: {
          organization_id: string | null
          organization_member_created_at: string | null
          organization_member_id: string
          organization_member_role: string
          profile_id: string | null
        }
        Insert: {
          organization_id?: string | null
          organization_member_created_at?: string | null
          organization_member_id?: string
          organization_member_role?: string
          profile_id?: string | null
        }
        Update: {
          organization_id?: string | null
          organization_member_created_at?: string | null
          organization_member_id?: string
          organization_member_role?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          organization_id: string
          organization_setting_id: string
          setting_created_at: string | null
          setting_key: string
          setting_updated_at: string | null
          setting_value: string
        }
        Insert: {
          organization_id: string
          organization_setting_id?: string
          setting_created_at?: string | null
          setting_key: string
          setting_updated_at?: string | null
          setting_value: string
        }
        Update: {
          organization_id?: string
          organization_setting_id?: string
          setting_created_at?: string | null
          setting_key?: string
          setting_updated_at?: string | null
          setting_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organizations: {
        Row: {
          organization_created_at: string | null
          organization_id: string
          organization_name: string
          organization_subscription_status: string
          organization_updated_at: string | null
        }
        Insert: {
          organization_created_at?: string | null
          organization_id?: string
          organization_name: string
          organization_subscription_status?: string
          organization_updated_at?: string | null
        }
        Update: {
          organization_created_at?: string | null
          organization_id?: string
          organization_name?: string
          organization_subscription_status?: string
          organization_updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          organization_id: string | null
          profile_created_at: string | null
          profile_display_name: string
          profile_email: string
          profile_id: string
          profile_updated_at: string | null
        }
        Insert: {
          organization_id?: string | null
          profile_created_at?: string | null
          profile_display_name: string
          profile_email: string
          profile_id: string
          profile_updated_at?: string | null
        }
        Update: {
          organization_id?: string | null
          profile_created_at?: string | null
          profile_display_name?: string
          profile_email?: string
          profile_id?: string
          profile_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      sales_scripts: {
        Row: {
          organization_id: string | null
          sales_script_audio: number
          sales_script_block1: number
          sales_script_block2: number
          sales_script_block3: number
          sales_script_conversion_rate: number
          sales_script_created_at: string | null
          sales_script_date: string
          sales_script_id: string
          sales_script_name: string
          sales_script_purchase: number
          sales_script_text: number
          sales_script_updated_at: string | null
          sales_script_whatsapp_reach: number
        }
        Insert: {
          organization_id?: string | null
          sales_script_audio: number
          sales_script_block1: number
          sales_script_block2: number
          sales_script_block3: number
          sales_script_conversion_rate: number
          sales_script_created_at?: string | null
          sales_script_date: string
          sales_script_id?: string
          sales_script_name: string
          sales_script_purchase: number
          sales_script_text: number
          sales_script_updated_at?: string | null
          sales_script_whatsapp_reach: number
        }
        Update: {
          organization_id?: string | null
          sales_script_audio?: number
          sales_script_block1?: number
          sales_script_block2?: number
          sales_script_block3?: number
          sales_script_conversion_rate?: number
          sales_script_created_at?: string | null
          sales_script_date?: string
          sales_script_id?: string
          sales_script_name?: string
          sales_script_purchase?: number
          sales_script_text?: number
          sales_script_updated_at?: string | null
          sales_script_whatsapp_reach?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_scripts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      services: {
        Row: {
          organization_id: string | null
          service_created_at: string | null
          service_description: string | null
          service_duration: number
          service_id: string
          service_name: string
          service_price: number
          service_updated_at: string | null
        }
        Insert: {
          organization_id?: string | null
          service_created_at?: string | null
          service_description?: string | null
          service_duration: number
          service_id?: string
          service_name: string
          service_price: number
          service_updated_at?: string | null
        }
        Update: {
          organization_id?: string | null
          service_created_at?: string | null
          service_description?: string | null
          service_duration?: number
          service_id?: string
          service_name?: string
          service_price?: number
          service_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      webhook_configurations: {
        Row: {
          organization_id: string | null
          webhook_config_id: string
          webhook_created_at: string | null
          webhook_enabled: boolean | null
          webhook_provider_name: string
          webhook_secret_key: string | null
          webhook_updated_at: string | null
          webhook_url: string
        }
        Insert: {
          organization_id?: string | null
          webhook_config_id?: string
          webhook_created_at?: string | null
          webhook_enabled?: boolean | null
          webhook_provider_name: string
          webhook_secret_key?: string | null
          webhook_updated_at?: string | null
          webhook_url: string
        }
        Update: {
          organization_id?: string | null
          webhook_config_id?: string
          webhook_created_at?: string | null
          webhook_enabled?: boolean | null
          webhook_provider_name?: string
          webhook_secret_key?: string | null
          webhook_updated_at?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: {
        Args: { org_name: string; org_status: string; user_id: string }
        Returns: string
      }
      get_user_organization_ids: {
        Args: { user_id: string }
        Returns: string[]
      }
      is_organization_admin: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
