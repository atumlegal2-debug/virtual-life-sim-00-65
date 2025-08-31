export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      custom_items: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string
          icon: string | null
          id: string
          item_type: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description: string
          icon?: string | null
          id: string
          item_type: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string
          icon?: string | null
          id?: string
          item_type?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_birth_requests: {
        Row: {
          created_at: string
          id: string
          manager_notes: string | null
          processed_at: string | null
          request_message: string | null
          status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_notes?: string | null
          processed_at?: string | null
          request_message?: string | null
          status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_notes?: string | null
          processed_at?: string | null
          request_message?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      hospital_treatment_requests: {
        Row: {
          created_at: string
          id: string
          manager_notes: string | null
          processed_at: string | null
          request_message: string | null
          status: string
          treatment_cost: number
          treatment_type: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_notes?: string | null
          processed_at?: string | null
          request_message?: string | null
          status?: string
          treatment_cost: number
          treatment_type: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_notes?: string | null
          processed_at?: string | null
          request_message?: string | null
          status?: string
          treatment_cost?: number
          treatment_type?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      hunger_control: {
        Row: {
          created_at: string
          id: string
          last_decrease_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_decrease_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_decrease_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          id: string
          item_id: string
          quantity: number
          received_at: string | null
          sent_by_user_id: string | null
          sent_by_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          quantity?: number
          received_at?: string | null
          sent_by_user_id?: string | null
          sent_by_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          quantity?: number
          received_at?: string | null
          sent_by_user_id?: string | null
          sent_by_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_sales: {
        Row: {
          amount: number
          buyer_username: string
          created_at: string
          id: string
          item_name: string
          manager_id: string
          order_id: string
        }
        Insert: {
          amount: number
          buyer_username: string
          created_at?: string
          id?: string
          item_name: string
          manager_id: string
          order_id: string
        }
        Update: {
          amount?: number
          buyer_username?: string
          created_at?: string
          id?: string
          item_name?: string
          manager_id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_sales_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "store_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_sales_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          is_new: boolean
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_new?: boolean
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_new?: boolean
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          approved_at: string | null
          created_at: string
          id: string
          items: Json
          manager_approved: boolean | null
          manager_notes: string | null
          status: string
          store_id: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          id?: string
          items: Json
          manager_approved?: boolean | null
          manager_notes?: string | null
          status?: string
          store_id: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          id?: string
          items?: Json
          manager_approved?: boolean | null
          manager_notes?: string | null
          status?: string
          store_id?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_requests: {
        Row: {
          created_at: string
          from_user_id: string
          from_username: string
          id: string
          processed_at: string | null
          proposal_type: string
          ring_data: Json
          status: string
          to_user_id: string
          to_username: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          from_username: string
          id?: string
          processed_at?: string | null
          proposal_type: string
          ring_data: Json
          status?: string
          to_user_id: string
          to_username: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          from_username?: string
          id?: string
          processed_at?: string | null
          proposal_type?: string
          ring_data?: Json
          status?: string
          to_user_id?: string
          to_username?: string
          updated_at?: string
        }
        Relationships: []
      }
      relationships: {
        Row: {
          created_at: string
          id: string
          relationship_type: string
          started_at: string
          updated_at: string
          user1_id: string
          user1_username: string
          user2_id: string
          user2_username: string
        }
        Insert: {
          created_at?: string
          id?: string
          relationship_type: string
          started_at?: string
          updated_at?: string
          user1_id: string
          user1_username: string
          user2_id: string
          user2_username: string
        }
        Update: {
          created_at?: string
          id?: string
          relationship_type?: string
          started_at?: string
          updated_at?: string
          user1_id?: string
          user1_username?: string
          user2_id?: string
          user2_username?: string
        }
        Relationships: []
      }
      store_managers: {
        Row: {
          balance: number | null
          created_at: string
          id: string
          password: string
          store_id: string
          updated_at: string
          username: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          id?: string
          password: string
          store_id: string
          updated_at?: string
          username: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          id?: string
          password?: string
          store_id?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_managers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          balance: number | null
          created_at: string
          id: string
          manager_password: string
          name: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          id: string
          manager_password: string
          name: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          id?: string
          manager_password?: string
          name?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          from_user_id: string
          from_username: string
          id: string
          to_user_id: string
          to_username: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          from_user_id: string
          from_username: string
          id?: string
          to_user_id: string
          to_username: string
          transaction_type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          from_user_id?: string
          from_username?: string
          id?: string
          to_user_id?: string
          to_username?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          target_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          target_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          target_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pregnancy: {
        Row: {
          created_at: string
          id: string
          pregnancy_percentage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pregnancy_percentage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pregnancy_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          about: string
          age: number
          alcoholism_percentage: number | null
          auth_user_id: string | null
          avatar: string | null
          created_at: string
          disease_percentage: number | null
          email: string
          energy_percentage: number | null
          family: string | null
          happiness_percentage: number | null
          hunger_percentage: number | null
          id: string
          life_percentage: number | null
          looking_for: string
          mood: number | null
          nickname: string | null
          race: string
          relationship_status: string | null
          updated_at: string
          user_code: string
          username: string
          wallet_balance: number | null
        }
        Insert: {
          about: string
          age: number
          alcoholism_percentage?: number | null
          auth_user_id?: string | null
          avatar?: string | null
          created_at?: string
          disease_percentage?: number | null
          email: string
          energy_percentage?: number | null
          family?: string | null
          happiness_percentage?: number | null
          hunger_percentage?: number | null
          id?: string
          life_percentage?: number | null
          looking_for: string
          mood?: number | null
          nickname?: string | null
          race: string
          relationship_status?: string | null
          updated_at?: string
          user_code: string
          username: string
          wallet_balance?: number | null
        }
        Update: {
          about?: string
          age?: number
          alcoholism_percentage?: number | null
          auth_user_id?: string | null
          avatar?: string | null
          created_at?: string
          disease_percentage?: number | null
          email?: string
          energy_percentage?: number | null
          family?: string | null
          happiness_percentage?: number | null
          hunger_percentage?: number | null
          id?: string
          life_percentage?: number | null
          looking_for?: string
          mood?: number | null
          nickname?: string | null
          race?: string
          relationship_status?: string | null
          updated_at?: string
          user_code?: string
          username?: string
          wallet_balance?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_pregnancy: {
        Args: { p_percentage?: number; p_username: string }
        Returns: {
          created_at: string
          id: string
          pregnancy_percentage: number | null
          updated_at: string
          user_id: string
        }
      }
      decrease_hunger: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_pregnancy: {
        Args: { p_username: string }
        Returns: {
          created_at: string
          id: string
          pregnancy_percentage: number | null
          updated_at: string
          user_id: string
        }
      }
      reset_user_pregnancy: {
        Args: { p_username: string }
        Returns: boolean
      }
      set_current_user: {
        Args: { username_value: string }
        Returns: undefined
      }
      update_user_pregnancy: {
        Args: { p_percentage: number; p_username: string }
        Returns: {
          created_at: string
          id: string
          pregnancy_percentage: number | null
          updated_at: string
          user_id: string
        }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
