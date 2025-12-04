import { createClient } from '@supabase/supabase-js';

// 從環境變數讀取 Supabase 設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database Types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  region?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DBHospital {
  id: string;
  name: string;
  address: string;
  region: string;
  level: string;
  stage: string;
  equipment_installed: boolean;
  last_visit: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DBContact {
  id: string;
  hospital_id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  is_key_decision_maker: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DBNote {
  id: string;
  hospital_id: string;
  content: string;
  activity_type: string;
  author_id: string; // 修正：有些專案可能是 author_id 或 author_name，請保留您原本有的
  author_name: string;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  sentiment: string | null;
  next_step: string | null;
  next_step_date: string | null;
  related_contact_ids: string[] | null;
  attendees: string | null;
}

export interface DBUsageRecord {
  id: string;
  hospital_id: string;
  product_code: string;
  quantity: number;
  date: string;
  type: string;
  recorded_by?: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface DBInstalledEquipment {
  id: string;
  hospital_id: string;
  product_code: string;
  install_date: string;
  quantity: number;
  ownership: string;
  created_by?: string;
  created_at: string;
}
