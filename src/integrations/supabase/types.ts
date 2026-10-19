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
      artist_snapshots: {
        Row: {
          artist_id: string
          deezer_fans: number | null
          id: string
          listeners: number
          playcount: number | null
          taken_on: string
        }
        Insert: {
          artist_id: string
          deezer_fans?: number | null
          id?: string
          listeners: number
          playcount?: number | null
          taken_on: string
        }
        Update: {
          artist_id?: string
          deezer_fans?: number | null
          id?: string
          listeners?: number
          playcount?: number | null
          taken_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_snapshots_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          aura_mix: Json
          bio: string
          callers_count: number
          city: string
          created_at: string
          deezer_fans: number | null
          deezer_id: number | null
          genre: string
          growth_rate: number
          id: string
          last_synced_at: string | null
          lastfm_url: string | null
          mbid: string | null
          monthly_listeners: number
          name: string
          playcount: number | null
          source: string
          tags: string[] | null
        }
        Insert: {
          aura_mix: Json
          bio: string
          callers_count?: number
          city: string
          created_at?: string
          deezer_fans?: number | null
          deezer_id?: number | null
          genre: string
          growth_rate: number
          id?: string
          last_synced_at?: string | null
          lastfm_url?: string | null
          mbid?: string | null
          monthly_listeners: number
          name: string
          playcount?: number | null
          source?: string
          tags?: string[] | null
        }
        Update: {
          aura_mix?: Json
          bio?: string
          callers_count?: number
          city?: string
          created_at?: string
          deezer_fans?: number | null
          deezer_id?: number | null
          genre?: string
          growth_rate?: number
          id?: string
          last_synced_at?: string | null
          lastfm_url?: string | null
          mbid?: string | null
          monthly_listeners?: number
          name?: string
          playcount?: number | null
          source?: string
          tags?: string[] | null
        }
        Relationships: []
      }
      board_users: {
        Row: {
          calls: number
          handle: string
          hits: number
          id: string
          score_all: number
          score_week: number
        }
        Insert: {
          calls: number
          handle: string
          hits: number
          id?: string
          score_all: number
          score_week: number
        }
        Update: {
          calls?: number
          handle?: string
          hits?: number
          id?: string
          score_all?: number
          score_week?: number
        }
        Relationships: []
      }
      calls: {
        Row: {
          artist_id: string
          called_at: string
          callers_at_call: number
          id: string
          is_big_call: boolean
          listeners_at_call: number
          user_id: string
        }
        Insert: {
          artist_id: string
          called_at?: string
          callers_at_call?: number
          id?: string
          is_big_call?: boolean
          listeners_at_call: number
          user_id: string
        }
        Update: {
          artist_id?: string
          called_at?: string
          callers_at_call?: number
          id?: string
          is_big_call?: boolean
          listeners_at_call?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      import_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          errors: Json
          id: string
          kind: string
          lease_token: string | null
          lease_until: string | null
          processed: number
          progress: Json
          retry_after: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          errors?: Json
          id?: string
          kind: string
          lease_token?: string | null
          lease_until?: string | null
          processed?: number
          progress?: Json
          retry_after?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          errors?: Json
          id?: string
          kind?: string
          lease_token?: string | null
          lease_until?: string | null
          processed?: number
          progress?: Json
          retry_after?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          connected: Json
          created_at: string
          genres: string[]
          handle: string
          id: string
          onboarded: boolean
          sim_months: number
          top8: Json
        }
        Insert: {
          connected?: Json
          created_at?: string
          genres?: string[]
          handle: string
          id: string
          onboarded?: boolean
          sim_months?: number
          top8?: Json
        }
        Update: {
          connected?: Json
          created_at?: string
          genres?: string[]
          handle?: string
          id?: string
          onboarded?: boolean
          sim_months?: number
          top8?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          role: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_artist_run: {
        Args: { p_id: string; p_token: string }
        Returns: boolean
      }
      save_real_artist: {
        Args: { p_artist: Json; p_day: string }
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
