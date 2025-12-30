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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          crisex_amount: number | null
          id: string
          live_id: string
          message: string
          mimo_icon: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          crisex_amount?: number | null
          id?: string
          live_id: string
          message: string
          mimo_icon?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          crisex_amount?: number | null
          id?: string
          live_id?: string
          message?: string
          mimo_icon?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discrete_mode_transactions: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          creator_share: number
          id: string
          live_id: string | null
          platform_share: number
          reel_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          creator_id: string
          creator_share: number
          id?: string
          live_id?: string | null
          platform_share: number
          reel_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          creator_share?: number
          id?: string
          live_id?: string | null
          platform_share?: number
          reel_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discrete_mode_transactions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrete_mode_transactions_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "lives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrete_mode_transactions_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrete_mode_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lives: {
        Row: {
          categories: string[] | null
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean | null
          meta_goal: number | null
          meta_progress: number | null
          streamer_id: string
          thumbnail_url: string | null
          title: string
          viewers_count: number | null
        }
        Insert: {
          categories?: string[] | null
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_goal?: number | null
          meta_progress?: number | null
          streamer_id: string
          thumbnail_url?: string | null
          title: string
          viewers_count?: number | null
        }
        Update: {
          categories?: string[] | null
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_goal?: number | null
          meta_progress?: number | null
          streamer_id?: string
          thumbnail_url?: string | null
          title?: string
          viewers_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lives_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mimos_history: {
        Row: {
          created_at: string
          id: string
          live_id: string | null
          mimo_icon: string
          mimo_name: string
          price: number
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          live_id?: string | null
          mimo_icon: string
          mimo_name: string
          price: number
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          live_id?: string | null
          mimo_icon?: string
          mimo_name?: string
          price?: number
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mimos_history_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mimos_history_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      private_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge: string | null
          categories: string[] | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          price: number
          title: string
          type: string
        }
        Insert: {
          badge?: string | null
          categories?: string[] | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price: number
          title: string
          type: string
        }
        Update: {
          badge?: string | null
          categories?: string[] | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price?: number
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number
          created_at: string
          display_name: string | null
          id: string
          is_vip: boolean | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          display_name?: string | null
          id: string
          is_vip?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          display_name?: string | null
          id?: string
          is_vip?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          product_id: string | null
          product_price: number
          product_title: string
          product_type: string
          seller_id: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          product_id?: string | null
          product_price: number
          product_title: string
          product_type: string
          seller_id?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          product_id?: string | null
          product_price?: number
          product_title?: string
          product_type?: string
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          audio_name: string | null
          categories: string[] | null
          comments_count: number | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_active: boolean | null
          likes_count: number | null
          shares_count: number | null
          thumbnail_url: string
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          audio_name?: string | null
          categories?: string[] | null
          comments_count?: number | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          likes_count?: number | null
          shares_count?: number | null
          thumbnail_url: string
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          audio_name?: string | null
          categories?: string[] | null
          comments_count?: number | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          likes_count?: number | null
          shares_count?: number | null
          thumbnail_url?: string
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reels_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reels_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reels_comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reels_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reels_likes: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reels_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reels_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_balance: {
        Args: { amount: number; user_id: string }
        Returns: undefined
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
