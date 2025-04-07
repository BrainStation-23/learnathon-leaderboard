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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      configurations: {
        Row: {
          created_at: string
          filtered_contributors: string[] | null
          github_org: string
          github_pat: string
          id: string
          sonarcloud_org: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filtered_contributors?: string[] | null
          github_org: string
          github_pat: string
          id?: string
          sonarcloud_org: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filtered_contributors?: string[] | null
          github_org?: string
          github_pat?: string
          id?: string
          sonarcloud_org?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contributors: {
        Row: {
          avatar_url: string | null
          contributions: number
          created_at: string
          github_id: number
          id: string
          login: string
          repository_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          contributions?: number
          created_at?: string
          github_id: number
          id?: string
          login: string
          repository_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          contributions?: number
          created_at?: string
          github_id?: number
          id?: string
          login?: string
          repository_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributors_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      filtered_repositories: {
        Row: {
          created_at: string
          id: string
          label: string | null
          reason: string | null
          repository_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          reason?: string | null
          repository_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          reason?: string | null
          repository_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filtered_repositories_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: true
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      repositories: {
        Row: {
          created_at: string
          description: string | null
          github_full_name: string | null
          github_repo_id: number | null
          html_url: string | null
          id: string
          name: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          github_full_name?: string | null
          github_repo_id?: number | null
          html_url?: string | null
          id?: string
          name: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          github_full_name?: string | null
          github_repo_id?: number | null
          html_url?: string | null
          id?: string
          name?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repositories_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      repository_metrics: {
        Row: {
          collected_at: string
          commits_count: number | null
          contributors_count: number | null
          id: string
          last_commit_date: string | null
          repository_id: string
        }
        Insert: {
          collected_at?: string
          commits_count?: number | null
          contributors_count?: number | null
          id?: string
          last_commit_date?: string | null
          repository_id: string
        }
        Update: {
          collected_at?: string
          commits_count?: number | null
          contributors_count?: number | null
          id?: string
          last_commit_date?: string | null
          repository_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repository_metrics_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      repository_tech_stacks: {
        Row: {
          created_at: string
          id: string
          repository_id: string
          tech_stack_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          repository_id: string
          tech_stack_id: string
        }
        Update: {
          created_at?: string
          id?: string
          repository_id?: string
          tech_stack_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repository_tech_stacks_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repository_tech_stacks_tech_stack_id_fkey"
            columns: ["tech_stack_id"]
            isOneToOne: false
            referencedRelation: "tech_stacks"
            referencedColumns: ["id"]
          },
        ]
      }
      sonar_metrics: {
        Row: {
          bugs: number | null
          code_smells: number | null
          collected_at: string
          complexity: number | null
          coverage: number | null
          id: string
          lines_of_code: number | null
          project_key: string | null
          repository_id: string
          technical_debt: string | null
          vulnerabilities: number | null
        }
        Insert: {
          bugs?: number | null
          code_smells?: number | null
          collected_at?: string
          complexity?: number | null
          coverage?: number | null
          id?: string
          lines_of_code?: number | null
          project_key?: string | null
          repository_id: string
          technical_debt?: string | null
          vulnerabilities?: number | null
        }
        Update: {
          bugs?: number | null
          code_smells?: number | null
          collected_at?: string
          complexity?: number | null
          coverage?: number | null
          id?: string
          lines_of_code?: number | null
          project_key?: string | null
          repository_id?: string
          technical_debt?: string | null
          vulnerabilities?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sonar_metrics_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tech_stacks: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_repositories_with_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          team_id: string
          html_url: string
          updated_at: string
          contributors_count: number
          commits_count: number
          last_commit_date: string
          sonar_project_key: string
          lines_of_code: number
          coverage: number
          bugs: number
          vulnerabilities: number
          code_smells: number
          technical_debt: string
          complexity: number
        }[]
      }
      log_audit_event: {
        Args: {
          p_user_id: string
          p_action: string
          p_entity_type: string
          p_entity_id: string
          p_details: Json
        }
        Returns: string
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
