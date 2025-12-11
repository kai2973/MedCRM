import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

// 擴展 Profile 類型
export interface ExtendedProfile extends Profile {
  role_type?: 'sales' | 'manager' | 'admin';
}

interface AuthContextType {
  user: User | null;
  profile: ExtendedProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshSession: () => Promise<boolean>;
  isManagerOrAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 追蹤最後一次 visibility check 的時間
  const lastVisibilityCheck = useRef<number>(0);
  const VISIBILITY_CHECK_INTERVAL = 30000; // 最少間隔 30 秒

  // 載入使用者 profile
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    }
  }, []);

  // 手動刷新 session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Failed to refresh session:', error);
        return false;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }, []);

  // 初始化:檢查目前 session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      // 處理特定事件
      switch (event) {
        case 'TOKEN_REFRESHED':
          console.log('Token was refreshed successfully');
          break;
        case 'SIGNED_OUT':
          console.log('User signed out');
          sessionStorage.removeItem('hospitalSortConfig');
          break;
        case 'USER_UPDATED':
          console.log('User was updated');
          break;
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // 定期檢查並刷新 session（每 10 分鐘，而不是 4 分鐘）
  useEffect(() => {
    if (!session) return;

    const checkAndRefreshSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          console.warn('Session lost during periodic check');
          return;
        }
        
        // 只有當 token 將在 5 分鐘內過期時才刷新
        const expiresAt = currentSession.expires_at;
        if (expiresAt) {
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = expiresAt - now;
          
          if (timeUntilExpiry < 300) {
            console.log('Token expiring soon, refreshing...');
            await refreshSession();
          }
        }
      } catch (error) {
        console.error('Error in periodic session check:', error);
      }
    };

    // 每 10 分鐘檢查一次（而不是 4 分鐘）
    const intervalId = setInterval(checkAndRefreshSession, 10 * 60 * 1000);

    // 當頁面從背景恢復時檢查（但有節流）
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        
        // 節流：最少間隔 30 秒
        if (now - lastVisibilityCheck.current < VISIBILITY_CHECK_INTERVAL) {
          return;
        }
        
        lastVisibilityCheck.current = now;
        console.log('Page became visible, checking session...');
        checkAndRefreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 當網路恢復時檢查
    const handleOnline = () => {
      console.log('Network restored, checking session...');
      checkAndRefreshSession();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [session, refreshSession]);

  // 登入
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  // 註冊 (管理員建立新使用者)
  const signUp = async (email: string, password: string, fullName: string, role: string = '業務') => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) return { error };
      
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  // 登出
  const signOut = async () => {
    sessionStorage.removeItem('hospitalSortConfig');
    
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // 更新 Profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // 重新載入 profile
      await loadProfile(user.id);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // 計算是否為 manager 或 admin
  const isManagerOrAdmin = profile?.role_type === 'manager' || profile?.role_type === 'admin';

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshSession,
    isManagerOrAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
