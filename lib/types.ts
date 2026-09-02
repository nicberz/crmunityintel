export type UserRole = "agency_admin" | "client_user";
export type CommissionType = "flat" | "percentage";
export type LeadFieldType = "text" | "number" | "date" | "select";
export type LeadStatus = "no_answer" | "reconsidering" | "not_interested" | "call_back" | "closed";
export type LeadSource = "manual" | "csv" | "facebook" | "website_form";
export type MetricsSource = "manual" | "facebook_api";

export const LEAD_STATUSES: LeadStatus[] = [
  "call_back",
  "no_answer",
  "reconsidering",
  "not_interested",
  "closed",
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  no_answer: "Neatbild",
  reconsidering: "Pārdomāja",
  not_interested: "Neinteresē",
  call_back: "Jāpārzvana",
  closed: "Noslēgts",
};

export interface Client {
  id: string;
  name: string;
  commission_amount_eur: number;
  commission_type: CommissionType;
  commission_percentage: number | null;
  api_key_prefix: string | null;
  whatsapp_phone: string | null;
  created_at: string;
}

// Row shape as it exists in the DB, including the API key hash used to
// authenticate incoming lead submissions. Kept separate from `Client` so
// UI-facing code never has the hash in scope.
export interface ClientRow extends Client {
  api_key_hash: string | null;
}

export interface Profile {
  id: string;
  role: UserRole;
  client_id: string | null;
  full_name: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  client_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  group_name: string | null;
  preferred_dates: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface LeadComment {
  id: string;
  lead_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface LeadStatusHistory {
  id: string;
  lead_id: string;
  old_status: LeadStatus | null;
  new_status: LeadStatus;
  changed_by: string | null;
  created_at: string;
}

export interface LeadFieldDefinition {
  id: string;
  client_id: string;
  key: string;
  label: string;
  field_type: LeadFieldType;
  options: string[] | null;
  is_required: boolean;
  sort_order: number;
  created_at: string;
}

export interface LeadFieldValue {
  id: string;
  lead_id: string;
  field_definition_id: string;
  value: string | null;
}

export interface AdMetricsDaily {
  id: string;
  client_id: string;
  date: string;
  spend_eur: number;
  leads_count: number;
  source: MetricsSource;
  created_by: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  client_id: string | null;
  lead_id: string | null;
  created_by: string | null;
  title: string;
  note: string | null;
  start_at: string;
  reminder_enabled: boolean;
  reminder_minutes_before: number;
  reminder_dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Minimal Supabase Database type. Extend with `supabase gen types typescript`
// once the project is linked, if you want full query-level type safety.
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: ClientRow;
        Insert: Partial<ClientRow> & { name: string };
        Update: Partial<ClientRow>;
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      leads: {
        Row: Lead;
        Insert: Partial<Lead> & { client_id: string };
        Update: Partial<Lead>;
      };
      ad_metrics_daily: {
        Row: AdMetricsDaily;
        Insert: Partial<AdMetricsDaily> & {
          client_id: string;
          date: string;
          spend_eur: number;
          leads_count: number;
        };
        Update: Partial<AdMetricsDaily>;
      };
      lead_comments: {
        Row: LeadComment;
        Insert: Partial<LeadComment> & { lead_id: string; body: string };
        Update: Partial<LeadComment>;
      };
      lead_status_history: {
        Row: LeadStatusHistory;
        Insert: Partial<LeadStatusHistory> & { lead_id: string; new_status: LeadStatus };
        Update: Partial<LeadStatusHistory>;
      };
      lead_field_definitions: {
        Row: LeadFieldDefinition;
        Insert: Partial<LeadFieldDefinition> & { client_id: string; key: string; label: string };
        Update: Partial<LeadFieldDefinition>;
      };
      lead_field_values: {
        Row: LeadFieldValue;
        Insert: Partial<LeadFieldValue> & { lead_id: string; field_definition_id: string };
        Update: Partial<LeadFieldValue>;
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: Partial<CalendarEvent> & { title: string; start_at: string };
        Update: Partial<CalendarEvent>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
