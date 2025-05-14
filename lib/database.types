export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: number
          user_id: string
          anime_id: number
          anime_title: string
          anime_cover_image: string | null
          added_at: string
        }
        Insert: {
          id?: number
          user_id: string
          anime_id: number
          anime_title: string
          anime_cover_image?: string | null
          added_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          anime_id?: number
          anime_title?: string
          anime_cover_image?: string | null
          added_at?: string
        }
      }
      watch_status: {
        Row: {
          id: number
          user_id: string
          anime_id: number
          status: string
          progress: number
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          anime_id: number
          status: string
          progress?: number
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          anime_id?: number
          status?: string
          progress?: number
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: number
          user_id: string
          anime_id: number
          content: string
          created_at: string
          updated_at: string
          parent_id: number | null
        }
        Insert: {
          id?: number
          user_id: string
          anime_id: number
          content: string
          created_at?: string
          updated_at?: string
          parent_id?: number | null
        }
        Update: {
          id?: number
          user_id?: string
          anime_id?: number
          content?: string
          created_at?: string
          updated_at?: string
          parent_id?: number | null
        }
      }
    }
  }
}
