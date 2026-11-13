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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          project_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "production_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      github_memory_repos: {
        Row: {
          created_at: string
          github_login: string
          last_error: string | null
          last_synced_at: string | null
          owner_marker: string
          repo_full_name: string
          repo_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          github_login: string
          last_error?: string | null
          last_synced_at?: string | null
          owner_marker?: string
          repo_full_name: string
          repo_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          github_login?: string
          last_error?: string | null
          last_synced_at?: string | null
          owner_marker?: string
          repo_full_name?: string
          repo_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "production_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          client_message_id: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          role: string
          user_id: string
        }
        Insert: {
          client_message_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
          user_id: string
        }
        Update: {
          client_message_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      production_items: {
        Row: {
          content: string
          created_at: string
          data: Json
          id: string
          kind: string
          project_id: string
          title: string
          user_id: string
          validated: boolean
          version: number
        }
        Insert: {
          content?: string
          created_at?: string
          data?: Json
          id?: string
          kind: string
          project_id: string
          title: string
          user_id: string
          validated?: boolean
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          project_id?: string
          title?: string
          user_id?: string
          validated?: boolean
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "production_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      production_node_versions: {
        Row: {
          content: string
          created_at: string
          data: Json
          id: string
          node_id: string
          note: string
          title: string
          user_id: string
          version: number
        }
        Insert: {
          content?: string
          created_at?: string
          data?: Json
          id?: string
          node_id: string
          note?: string
          title: string
          user_id: string
          version: number
        }
        Update: {
          content?: string
          created_at?: string
          data?: Json
          id?: string
          node_id?: string
          note?: string
          title?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_node_versions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "production_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      production_nodes: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          kind: string
          parent_id: string | null
          position: number
          project_id: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          kind: string
          parent_id?: string | null
          position?: number
          project_id: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          kind?: string
          parent_id?: string | null
          position?: number
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "production_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "production_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      production_projects: {
        Row: {
          created_at: string
          description: string
          id: string
          target_duration_seconds: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          target_duration_seconds?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          target_duration_seconds?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_api_credentials: {
        Row: {
          created_at: string
          id: string
          key_ciphertext: string
          key_hint: string
          provider: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key_ciphertext: string
          key_hint: string
          provider: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key_ciphertext?: string
          key_hint?: string
          provider?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      works: {
        Row: {
          created_at: string
          id: string
          kind: string
          project_id: string | null
          prompt: string
          result: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          project_id?: string | null
          prompt: string
          result?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          project_id?: string | null
          prompt?: string
          result?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "works_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "production_projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
