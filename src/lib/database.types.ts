export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      classes: {
        Row: {
          color: Database["public"]["Enums"]["class_color"]
          created_at: string
          id: string
          name: string
          sort_order: number
          space_id: string
        }
        Insert: {
          color?: Database["public"]["Enums"]["class_color"]
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          space_id: string
        }
        Update: {
          color?: Database["public"]["Enums"]["class_color"]
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_space_id: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          imported_at: string | null
          onboarded_at: string | null
          theme: Database["public"]["Enums"]["app_theme"]
          view: Database["public"]["Enums"]["app_view"]
        }
        Insert: {
          active_space_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          imported_at?: string | null
          onboarded_at?: string | null
          theme?: Database["public"]["Enums"]["app_theme"]
          view?: Database["public"]["Enums"]["app_view"]
        }
        Update: {
          active_space_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          imported_at?: string | null
          onboarded_at?: string | null
          theme?: Database["public"]["Enums"]["app_theme"]
          view?: Database["public"]["Enums"]["app_view"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_space_id_fkey"
            columns: ["active_space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["member_role"]
          space_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          space_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["space_kind"]
          name: string
          owner_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["space_kind"]
          name: string
          owner_id?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["space_kind"]
          name?: string
          owner_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          class_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          due: string | null
          id: string
          notes: string
          priority: Database["public"]["Enums"]["task_priority"]
          space_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          class_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due?: string | null
          id?: string
          notes?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          space_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          class_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due?: string | null
          id?: string
          notes?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          space_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_class_fkey"
            columns: ["class_id", "space_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id", "space_id"]
          },
          {
            foreignKeyName: "tasks_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      remove_class: {
        Args: { class_id: string; with_tasks: boolean }
        Returns: undefined
      }
    }
    Enums: {
      app_theme: "aksis" | "light" | "dark" | "aksis_light" | "aksis_dark"
      app_view: "list" | "calendar"
      class_color:
        | "violet"
        | "blue"
        | "teal"
        | "rose"
        | "green"
        | "orange"
        | "pink"
        | "amber"
        | "slate"
      member_role: "owner" | "editor" | "viewer"
      space_kind: "semester" | "custom"
      task_priority: "high" | "medium" | "low"
      task_status: "not_started" | "in_progress" | "completed"
      task_type:
        | "reading"
        | "memorization"
        | "essay"
        | "performance_task"
        | "group_project"
        | "quiz_exam"
        | "requirement"
        | "drawing"
        | "activity_task"
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
    Enums: {
      app_theme: ["aksis", "light", "dark", "aksis_light", "aksis_dark"],
      app_view: ["list", "calendar"],
      class_color: [
        "violet",
        "blue",
        "teal",
        "rose",
        "green",
        "orange",
        "pink",
        "amber",
        "slate",
      ],
      member_role: ["owner", "editor", "viewer"],
      space_kind: ["semester", "custom"],
      task_priority: ["high", "medium", "low"],
      task_status: ["not_started", "in_progress", "completed"],
      task_type: [
        "reading",
        "memorization",
        "essay",
        "performance_task",
        "group_project",
        "quiz_exam",
        "requirement",
        "drawing",
        "activity_task",
      ],
    },
  },
} as const
