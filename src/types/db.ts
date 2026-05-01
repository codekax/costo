// Placeholder DB types — replace with output of `supabase gen types typescript --project-id $ID`
// after migrations run on the cloud project.
// Types kept minimal but typed (no `any`) so the rest of the codebase compiles.

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          kind: 'personal' | 'shared';
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          kind: 'personal' | 'shared';
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>;
        Relationships: [];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'editor';
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'editor';
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workspace_members']['Insert']>;
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: 'owner' | 'editor';
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role: 'owner' | 'editor';
          token?: string;
          expires_at: string;
          accepted_at?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['invitations']['Insert']>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          type: 'renovation' | 'general' | 'other';
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          budget_ars: number | null;
          budget_usd: number | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          type?: 'renovation' | 'general' | 'other';
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          budget_ars?: number | null;
          budget_usd?: number | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
          icon: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string;
          icon?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          contact: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          contact?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['vendors']['Insert']>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          category_id: string;
          vendor_id: string | null;
          amount: number;
          currency: 'ARS' | 'USD';
          fx_rate_used: number;
          amount_ars: number;
          amount_usd: number;
          description: string | null;
          notes: string | null;
          paid_at: string;
          attachment_url: string | null;
          attachment_type: 'image' | 'pdf' | null;
          recurring_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          category_id: string;
          vendor_id?: string | null;
          amount: number;
          currency: 'ARS' | 'USD';
          fx_rate_used: number;
          amount_ars: number;
          amount_usd: number;
          description?: string | null;
          notes?: string | null;
          paid_at?: string;
          attachment_url?: string | null;
          attachment_type?: 'image' | 'pdf' | null;
          recurring_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
        Relationships: [];
      };
      recurring_expenses: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          category_id: string;
          vendor_id: string | null;
          amount: number;
          currency: 'ARS' | 'USD';
          description: string | null;
          frequency: 'monthly' | 'quarterly' | 'yearly';
          next_due_at: string;
          paused_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          category_id: string;
          vendor_id?: string | null;
          amount: number;
          currency: 'ARS' | 'USD';
          description?: string | null;
          frequency: 'monthly' | 'quarterly' | 'yearly';
          next_due_at: string;
          paused_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['recurring_expenses']['Insert']>;
        Relationships: [];
      };
      daily_fx_rates: {
        Row: {
          date: string;
          ars_per_usd_official: number;
          source: string;
          fetched_at: string;
        };
        Insert: {
          date: string;
          ars_per_usd_official: number;
          source?: string;
          fetched_at?: string;
        };
        Update: Partial<Database['public']['Tables']['daily_fx_rates']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      workspace_kind: 'personal' | 'shared';
      workspace_role: 'owner' | 'editor';
      project_type: 'renovation' | 'general' | 'other';
      currency_code: 'ARS' | 'USD';
      recurrence_frequency: 'monthly' | 'quarterly' | 'yearly';
    };
    CompositeTypes: Record<never, never>;
  };
};
