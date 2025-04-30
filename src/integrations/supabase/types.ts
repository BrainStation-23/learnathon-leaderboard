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
          license_name: string | null
          license_spdx_id: string | null
          license_url: string | null
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
          license_name?: string | null
          license_spdx_id?: string | null
          license_url?: string | null
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
          license_name?: string | null
          license_spdx_id?: string | null
          license_url?: string | null
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
      security_issues: {
        Row: {
          created_at: string
          html_url: string | null
          id: string
          published_at: string | null
          repository_id: string
          severity: string
          state: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_url?: string | null
          id?: string
          published_at?: string | null
          repository_id: string
          severity: string
          state?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_url?: string | null
          id?: string
          published_at?: string | null
          repository_id?: string
          severity?: string
          state?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_issues_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
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
      ensure_admin_config: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_audit_logs: {
        Args: {
          p_page: number
          p_page_size: number
          p_action?: string
          p_entity_type?: string
          p_search?: string
        }
        Returns: {
          id: string
          action: string
          entity_type: string
          created_at: string
          details: Json
          entity_id: string
          user_id: string
          total_count: number
        }[]
      }
      get_contributor_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          reposwithoneactivecontributor: number
          reposwithtwoactivecontributors: number
          reposwiththreeactivecontributors: number
          reposwithnorecentactivity: number
        }[]
      }
      get_contributors_with_repos: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_filtered_logins?: string[]
        }
        Returns: {
          login: string
          avatar_url: string
          repository_id: string
          repository_name: string
          contributions: number
        }[]
      }
      get_detailed_stack_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          total_count: number
          dropped_out_count: number
          inactive_count: number
        }[]
      }
      get_filter_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total: number
          droppedout: number
          nocontact: number
          gotjob: number
          other: number
        }[]
      }
      get_individual_contributors: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_search_term?: string
          p_sort_order?: string
        }
        Returns: {
          login: string
          avatar_url: string
          total_contributions: number
          repositories: Json
          has_more: boolean
        }[]
      }
      get_monthly_commit_activity: {
        Args: Record<PropertyKey, never>
        Returns: {
          month: string
          commit_count: number
        }[]
      }
      get_monthly_contributor_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          month: string
          contributor_count: number
        }[]
      }
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
          license_name: string
          license_url: string
          license_spdx_id: string
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
      get_repository_activity: {
        Args: Record<PropertyKey, never>
        Returns: {
          reposwithrecentactivity: number
          reposwithnorecentactivity: number
        }[]
      }
      get_repository_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          totalrepos: number
          totalcontributors: number
        }[]
      }
      get_unique_action_types: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
        }[]
      }
      get_unique_entity_types: {
        Args: Record<PropertyKey, never>
        Returns: {
          entity_type: string
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
