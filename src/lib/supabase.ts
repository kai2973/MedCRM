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
    // 設定較短的 storage key 避免衝突
    storageKey: 'medcrm-auth',
  }
});

// 確保 session 有效的 helper function
export const ensureValidSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      return false;
    }
    
    if (!session) {
      console.warn('No active session');
      return false;
    }
    
    // 檢查 token 是否即將過期（5 分鐘內）
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      // 如果 token 將在 5 分鐘內過期，嘗試刷新
      if (timeUntilExpiry < 300) {
        console.log('Token expiring soon, refreshing...');
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          return false;
        }
        
        console.log('Session refreshed successfully');
        return !!data.session;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking session:', error);
    return false;
  }
};

// 帶有自動重試的 API 請求包裝器
export const withRetry = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  maxRetries: number = 2
): Promise<{ data: T | null; error: any }> => {
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 確保 session 有效
      const isValid = await ensureValidSession();
      
      if (!isValid && attempt === maxRetries) {
        // 最後一次嘗試仍然無效，返回錯誤
        return { 
          data: null, 
          error: { message: 'Session expired. Please refresh the page and log in again.' } 
        };
      }
      
      const result = await operation();
      
      // 檢查是否是認證錯誤
      if (result.error) {
        const errorMessage = result.error.message?.toLowerCase() || '';
        const isAuthError = 
          errorMessage.includes('jwt') ||
          errorMessage.includes('token') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('auth') ||
          result.error.code === 'PGRST301';
        
        if (isAuthError && attempt < maxRetries) {
          console.log(`Auth error on attempt ${attempt + 1}, retrying...`);
          // 嘗試刷新 session
          await supabase.auth.refreshSession();
          continue;
        }
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Operation failed on attempt ${attempt + 1}:`, error);
      
      if (attempt < maxRetries) {
        // 等待一小段時間再重試
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  return { data: null, error: lastError };
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
