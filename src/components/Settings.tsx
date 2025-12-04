
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Bell, Shield, Database, Save, Check, Loader, Pencil, X, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Settings: React.FC = () => {
  const { user, profile: authProfile, updateProfile } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const hasLoadedOnce = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 編輯模式狀態
  const [isEditing, setIsEditing] = useState(false);
  
  // 頭像上傳狀態
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Profile Form State
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    role: '',
    region: '',
    bio: '',
    avatar_url: ''
  });

  // 編輯時的暫存資料
  const [editForm, setEditForm] = useState({
    full_name: '',
    role: '',
    region: '',
    bio: ''
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyDigest: false,
    newLeads: true,
    dealUpdates: true
  });

  // 載入 profile 資料
  const loadProfile = useCallback(async (showLoading = true) => {
    if (!user) return;

    // 只有首次載入時顯示 loading
    if (showLoading && !hasLoadedOnce.current) {
      setInitialLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          role: data.role || '業務代表',
          region: data.region || '北區',
          bio: data.bio || '',
          avatar_url: data.avatar_url || ''
        });
      } else {
        // 如果沒有 profile，使用 user email
        setProfile(prev => ({
          ...prev,
          email: user.email || ''
        }));
      }
      
      hasLoadedOnce.current = true;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile(true);
  }, [loadProfile]);

  // 視窗重新獲得焦點時，背景靜默更新
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasLoadedOnce.current && user) {
        loadProfile(false); // 不顯示 loading
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadProfile, user]);

  // 處理頭像上傳
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案');
      return;
    }

    // 檢查檔案大小 (最大 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('圖片大小不能超過 2MB');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // 產生唯一檔名
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 上傳到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('上傳失敗，請稍後再試');
        return;
      }

      // 取得公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 更新 profile
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        console.error('Update error:', updateError);
        alert('更新失敗，請稍後再試');
        return;
      }

      // 更新本地狀態
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      
    } catch (error) {
      console.error('Error:', error);
      alert('上傳失敗，請稍後再試');
    } finally {
      setIsUploadingAvatar(false);
      // 清除 input 讓同一張圖可以再選
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 開始編輯
  const handleStartEdit = () => {
    setEditForm({
      full_name: profile.full_name,
      role: profile.role,
      region: profile.region,
      bio: profile.bio
    });
    setIsEditing(true);
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      full_name: '',
      role: '',
      region: '',
      bio: ''
    });
  };

  // 儲存 profile
  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: editForm.full_name,
          email: profile.email,
          role: editForm.role,
          region: editForm.region,
          bio: editForm.bio,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving profile:', error);
        alert('儲存失敗，請稍後再試');
      } else {
        // 更新顯示的 profile
        setProfile(prev => ({
          ...prev,
          full_name: editForm.full_name,
          role: editForm.role,
          region: editForm.region,
          bio: editForm.bio
        }));
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  // 變更密碼
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    // 驗證
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('請填寫所有欄位');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('密碼至少需要 8 個字元');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('兩次輸入的密碼不一致');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch (error) {
      setPasswordError('變更密碼時發生錯誤');
    } finally {
      setIsSaving(false);
    }
  };

  // 匯出資料
  const handleExportData = async () => {
    try {
      const [hospitals, contacts, notes, usage] = await Promise.all([
        supabase.from('hospitals').select('*'),
        supabase.from('contacts').select('*'),
        supabase.from('notes').select('*'),
        supabase.from('usage_records').select('*')
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        hospitals: hospitals.data || [],
        contacts: contacts.data || [],
        notes: notes.data || [],
        usageRecords: usage.data || []
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medcrm-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('匯出失敗，請稍後再試');
    }
  };

  if (initialLoading && !hasLoadedOnce.current) {
    return (
      <div className="p-6 lg:p-10 max-w-6xl mx-auto min-h-full flex items-center justify-center">
        <div className="text-center">
          <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500">載入設定...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto min-h-full">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">設定</h1>
        <p className="text-slate-500 mb-8">管理您的帳戶偏好與應用程式設定。</p>

        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation for Settings */}
            <div className="w-full md:w-64 flex-shrink-0">
                <nav className="space-y-1">
                    <button
                        onClick={() => setActiveSection('profile')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${activeSection === 'profile' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                    >
                        <User size={18} />
                        <span>個人資料</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('notifications')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${activeSection === 'notifications' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                    >
                        <Bell size={18} />
                        <span>通知設定</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('security')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${activeSection === 'security' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                    >
                        <Shield size={18} />
                        <span>帳戶安全</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('data')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${activeSection === 'data' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                    >
                        <Database size={18} />
                        <span>資料管理</span>
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    {activeSection === 'profile' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">個人資料</h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {isEditing ? '編輯您的個人詳細資訊。' : '查看您的個人詳細資訊與簡介。'}
                                    </p>
                                </div>
                                {!isEditing && (
                                    <button
                                        onClick={handleStartEdit}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Pencil size={16} />
                                        <span>編輯</span>
                                    </button>
                                )}
                            </div>

                            {/* 頭像區塊 */}
                            <div className="flex items-center space-x-6 pb-6 border-b border-slate-100">
                                <div className="relative group">
                                    {profile.avatar_url ? (
                                        <img 
                                            src={profile.avatar_url} 
                                            alt="頭像"
                                            className="w-20 h-20 rounded-full object-cover shadow-inner"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                                            {(isEditing ? editForm.full_name : profile.full_name)?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                    {/* 上傳按鈕 overlay */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingAvatar}
                                        className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer disabled:cursor-wait"
                                    >
                                        {isUploadingAvatar ? (
                                            <Loader size={24} className="text-white animate-spin" />
                                        ) : (
                                            <Camera size={24} className="text-white" />
                                        )}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                    />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-slate-900">
                                        {isEditing ? editForm.full_name || '未設定姓名' : profile.full_name || '未設定姓名'}
                                    </p>
                                    <p className="text-sm text-slate-500">{profile.email}</p>
                                    <p className="text-xs text-slate-400 mt-1">點擊頭像更換照片</p>
                                </div>
                            </div>

                            {/* 檢視模式 */}
                            {!isEditing && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">全名</p>
                                            <p className="text-slate-900">{profile.full_name || '未設定'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">電子郵件</p>
                                            <p className="text-slate-900">{profile.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">職稱</p>
                                            <p className="text-slate-900">{profile.role || '未設定'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">區域</p>
                                            <p className="text-slate-900">{profile.region || '未設定'}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-sm font-medium text-slate-500 mb-1">簡介</p>
                                            <p className="text-slate-900 whitespace-pre-wrap">{profile.bio || '未設定'}</p>
                                        </div>
                                    </div>
                                    
                                    {saveSuccess && (
                                        <div className="flex items-center text-sm text-green-600 font-medium animate-fade-in">
                                            <Check size={16} className="mr-1.5" />
                                            變更已儲存
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 編輯模式 */}
                            {isEditing && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">全名</label>
                                            <input 
                                                type="text" 
                                                value={editForm.full_name}
                                                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="請輸入您的姓名"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">電子郵件</label>
                                            <input 
                                                type="email" 
                                                value={profile.email}
                                                disabled
                                                className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-xl px-4 py-2.5 outline-none cursor-not-allowed"
                                            />
                                            <p className="text-xs text-slate-400 mt-1">電子郵件無法變更</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">職稱</label>
                                            <input 
                                                type="text" 
                                                value={editForm.role}
                                                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="例如：資深業務代表"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">區域</label>
                                            <select 
                                                value={editForm.region}
                                                onChange={(e) => setEditForm({...editForm, region: e.target.value})}
                                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                                            >
                                                <option>北區</option>
                                                <option>中區</option>
                                                <option>南區</option>
                                                <option>東區</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">簡介</label>
                                            <textarea 
                                                rows={4}
                                                value={editForm.bio}
                                                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                                placeholder="簡單介紹一下自己..."
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* 編輯模式按鈕 */}
                                    <div className="pt-4 flex items-center justify-end space-x-3">
                                        <button 
                                            onClick={handleCancelEdit}
                                            disabled={isSaving}
                                            className="px-6 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-medium transition-colors flex items-center disabled:opacity-50"
                                        >
                                            <X size={18} className="mr-1.5" />
                                            取消
                                        </button>
                                        <button 
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader size={18} className="animate-spin mr-2" />
                                                    儲存中...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={18} className="mr-2" />
                                                    儲存
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'notifications' && (
                         <div className="space-y-6 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">通知設定</h2>
                                <p className="text-sm text-slate-500 mt-1">選擇您希望接收通知的方式。</p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-blue-100 transition-colors">
                                    <div>
                                        <p className="font-semibold text-slate-900">郵件提醒</p>
                                        <p className="text-sm text-slate-500">接收緊急項目的郵件通知。</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={notifications.emailAlerts} onChange={() => setNotifications({...notifications, emailAlerts: !notifications.emailAlerts})} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-blue-100 transition-colors">
                                    <div>
                                        <p className="font-semibold text-slate-900">每週摘要</p>
                                        <p className="text-sm text-slate-500">每週銷售績效的摘要報告。</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={notifications.weeklyDigest} onChange={() => setNotifications({...notifications, weeklyDigest: !notifications.weeklyDigest})} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-blue-100 transition-colors">
                                    <div>
                                        <p className="font-semibold text-slate-900">新潛在客戶</p>
                                        <p className="text-sm text-slate-500">當有新客戶指派給您時通知。</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={notifications.newLeads} onChange={() => setNotifications({...notifications, newLeads: !notifications.newLeads})} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 italic">* 通知功能即將推出</p>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">帳戶安全</h2>
                                <p className="text-sm text-slate-500 mt-1">管理您的密碼與登入設定。</p>
                            </div>
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm">
                                <p className="font-bold mb-1">密碼要求</p>
                                <p>至少 8 個字元。建議包含大小寫字母、數字和特殊符號。</p>
                            </div>
                            
                            {passwordError && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                                    {passwordError}
                                </div>
                            )}
                            
                            {passwordSuccess && (
                                <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm flex items-center">
                                    <Check size={16} className="mr-2" />
                                    密碼已成功變更
                                </div>
                            )}
                            
                             <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">新密碼</label>
                                    <input 
                                        type="password" 
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="輸入新密碼"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">確認新密碼</label>
                                    <input 
                                        type="password" 
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="再次輸入新密碼"
                                    />
                                </div>
                             </div>
                             
                             {/* Password Save Button */}
                             <div className="pt-4">
                                <button 
                                    onClick={handleChangePassword}
                                    disabled={isSaving}
                                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader size={18} className="animate-spin mr-2" />
                                            變更中...
                                        </>
                                    ) : (
                                        <>
                                            <Shield size={18} className="mr-2" />
                                            變更密碼
                                        </>
                                    )}
                                </button>
                             </div>
                        </div>
                    )}

                    {activeSection === 'data' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">資料管理</h2>
                                <p className="text-sm text-slate-500 mt-1">匯出資料或管理您的帳戶。</p>
                            </div>
                             <div className="p-6 border border-slate-200 rounded-xl flex items-center justify-between hover:border-blue-200 transition-colors">
                                <div>
                                    <p className="font-bold text-slate-900">匯出所有資料</p>
                                    <p className="text-sm text-slate-500 mt-1">下載包含所有醫院、聯絡人、筆記和訂單的 JSON 檔案。</p>
                                </div>
                                <button 
                                    onClick={handleExportData}
                                    className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                >
                                    下載 JSON
                                </button>
                             </div>
                             <div className="p-6 border border-slate-200 rounded-xl flex items-center justify-between hover:border-red-200 transition-colors bg-red-50/50">
                                <div>
                                    <p className="font-bold text-red-900">刪除帳戶</p>
                                    <p className="text-sm text-red-700 mt-1">永久刪除您的帳戶及所有相關資料。此操作無法復原。</p>
                                </div>
                                <button 
                                    className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                                    onClick={() => alert('請聯絡系統管理員刪除帳戶')}
                                >
                                    刪除帳戶
                                </button>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Settings;
