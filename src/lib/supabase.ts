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
    detectSessionInUrl: true,
    storageKey: 'medcrm-auth',
  }
});

// 簡化的 session 檢查 - 只在真正需要時才刷新
let lastSessionCheck = 0;
const SESSION_CHECK_INTERVAL = 60000; // 最多每分鐘檢查一次

export const ensureValidSession = async (): Promise<boolean> => {
  try {
    const now = Date.now();
    
    // 避免太頻繁檢查
    if (now - lastSessionCheck < SESSION_CHECK_INTERVAL) {
      return true; // 假設 session 仍有效
    }
    
    lastSessionCheck = now;
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      return false;
    }
    
    if (!session) {
      console.warn('No active session');
      return false;
    }
    
    // 只有當 token 將在 2 分鐘內過期時才刷新
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - nowSeconds;
      
      if (timeUntilExpiry < 120) {
        console.log('Token expiring soon, refreshing...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          return false;
        }
        
        console.log('Session refreshed successfully');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking session:', error);
    return true; // 發生錯誤時不阻止操作，讓 Supabase client 自己處理
  }
};

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
  author_id: string;
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
