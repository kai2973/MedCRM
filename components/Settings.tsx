
import React, { useState } from 'react';
import { User, Bell, Shield, Database, Save, Check } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mock Form State
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@medsales.com',
    role: '資深業務代表',
    region: '北區',
    bio: '專注於呼吸照護解決方案的資深業務。'
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyDigest: false,
    newLeads: true,
    dealUpdates: true
  });

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

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
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">個人資料</h2>
                                <p className="text-sm text-slate-500 mt-1">更新您的個人詳細資訊與簡介。</p>
                            </div>
                            <div className="flex items-center space-x-6 pb-6 border-b border-slate-100">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                                    {profile.name.charAt(0)}
                                </div>
                                <div>
                                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">變更頭像</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">全名</label>
                                    <input 
                                        type="text" 
                                        value={profile.name}
                                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">電子郵件</label>
                                    <input 
                                        type="email" 
                                        value={profile.email}
                                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">職稱</label>
                                    <input 
                                        type="text" 
                                        value={profile.role}
                                        disabled
                                        className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-xl px-4 py-2.5 outline-none cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">區域</label>
                                    <select 
                                        value={profile.region}
                                        onChange={(e) => setProfile({...profile, region: e.target.value})}
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
                                        value={profile.bio}
                                        onChange={(e) => setProfile({...profile, bio: e.target.value})}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>
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
                                <p>至少 8 個字元，包含一個大寫字母、一個數字和一個特殊符號。</p>
                            </div>
                             <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">目前密碼</label>
                                    <input 
                                        type="password" 
                                        placeholder="••••••••"
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">新密碼</label>
                                    <input 
                                        type="password" 
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">確認新密碼</label>
                                    <input 
                                        type="password" 
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                             </div>
                        </div>
                    )}

                    {activeSection === 'data' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">資料管理</h2>
                                <p className="text-sm text-slate-500 mt-1">匯出資料或管理本機儲存。</p>
                            </div>
                             <div className="p-6 border border-slate-200 rounded-xl flex items-center justify-between hover:border-blue-200 transition-colors">
                                <div>
                                    <p className="font-bold text-slate-900">匯出所有資料</p>
                                    <p className="text-sm text-slate-500 mt-1">下載包含所有醫院、筆記和記錄的 JSON 檔案。</p>
                                </div>
                                <button className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                                    下載 JSON
                                </button>
                             </div>
                             <div className="p-6 border border-slate-200 rounded-xl flex items-center justify-between hover:border-red-200 transition-colors bg-red-50/50">
                                <div>
                                    <p className="font-bold text-red-900">刪除帳戶</p>
                                    <p className="text-sm text-red-700 mt-1">永久刪除您的帳戶及所有相關資料。</p>
                                </div>
                                <button className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors">
                                    刪除帳戶
                                </button>
                             </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end space-x-4">
                        {saveSuccess && (
                            <span className="text-sm text-green-600 font-medium flex items-center animate-fade-in">
                                <Check size={16} className="mr-1.5" />
                                變更已儲存
                            </span>
                        )}
                        <button className="px-6 py-2.5 text-slate-600 font-medium hover:text-slate-900 transition-colors">
                            取消
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    儲存中...
                                </>
                            ) : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    儲存變更
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Settings;
