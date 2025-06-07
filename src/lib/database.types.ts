export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chat_history: {
        Row: {
          id: number
          user_id: string
          message: string
          response: string
          image_url: string | null
          created_at: string
          conversation_id: string
          message_type: 'text' | 'image'
        }
        Insert: {
          id?: number
          user_id: string
          message: string
          response: string
          image_url?: string | null
          created_at?: string
          conversation_id: string
          message_type: 'text' | 'image'
        }
        Update: {
          id?: number
          user_id?: string
          message?: string
          response?: string
          image_url?: string | null
          created_at?: string
          conversation_id?: string
          message_type?: 'text' | 'image'
        }
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
  }
} 