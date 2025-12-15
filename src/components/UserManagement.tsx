import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, Loader, Check, X, Shield, UserCog, User, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role_type: 'sales' | 'manager' | 'admin';
  role?: string;
  region?: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: '管理員', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Shield },
  manager: { label: '經理', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: UserCog },
  sales: { label: '業務', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: User },
};

const UserManagement: React.FC = () => {
  const { profile: currentUserProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 新增使用者 Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role_type: 'sales' as 'sales' | 'manager' | 'admin',
    role: '業務代表',
    region: '北區'
  });
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  
  // 編輯使用者 Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    role_type: 'sales' as 'sales' | 'manager' | 'admin',
    role: '',
    region: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // 刪除確認
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 檢查是否為 admin
  const isAdmin = currentUserProfile?.role_type === 'admin';

  // 載入所有使用者
  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role_type, role, region, created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('載入使用者列表失敗');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 新增使用者
  const handleAddUser = async () => {
    if (!addForm.email || !addForm.password || !addForm.full_name) {
      setAddError('請填寫所有必填欄位');
      return;
    }

    if (addForm.password.length < 6) {
      setAddError('密碼至少需要 6 個字元');
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      // 1. 使用 Supabase Auth 建立使用者
      // 注意：這需要特殊的 admin 權限，一般前端無法直接建立使用者
      // 我們改用 signUp 但這會需要 email 驗證
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: addForm.email,
        password: addForm.password,
        options: {
          data: {
            full_name: addForm.full_name
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setAddError('此 Email 已被註冊');
        } else {
          setAddError(authError.message);
        }
        return;
      }

      if (!authData.user) {
        setAddError('建立使用者失敗');
        return;
      }

      // 2. 建立或更新 profile（設定 role_type）
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: addForm.email,
          full_name: addForm.full_name,
          role_type: addForm.role_type,
          role: addForm.role,
          region: addForm.region,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile error:', profileError);
        // 即使 profile 建立失敗，使用者已經建立了
      }

      // 成功
      setShowAddModal(false);
      setAddForm({
        email: '',
        password: '',
        full_name: '',
        role_type: 'sales',
        role: '業務代表',
        region: '北區'
      });
      loadUsers();
      
    } catch (err) {
      console.error('Error adding user:', err);
      setAddError('新增使用者失敗，請稍後再試');
    } finally {
      setIsAdding(false);
    }
  };

  // 開始編輯使用者
  const startEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || '',
      role_type: user.role_type || 'sales',
      role: user.role || '業務代表',
      region: user.region || '北區'
    });
  };

  // 儲存編輯
  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setIsEditing(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          role_type: editForm.role_type,
          role: editForm.role,
          region: editForm.region,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setEditingUser(null);
      loadUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      alert('更新失敗，請稍後再試');
    } finally {
      setIsEditing(false);
    }
  };

  // 刪除使用者（只刪除 profile，不刪除 auth user）
  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    // 防止刪除自己
    if (deletingUser.id === currentUserProfile?.id) {
      alert('無法刪除自己的帳號');
      setDeletingUser(null);
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deletingUser.id);

      if (error) throw error;

      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('刪除失敗，請稍後再試');
    } finally {
      setIsDeleting(false);
    }
  };

  // 非 admin 不顯示
  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <Shield size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">您沒有權限存取此頁面</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader size={24} className="animate-spin text-blue-600 mr-2" />
        <span className="text-slate-500">載入使用者列表...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">使用者管理</h2>
          <p className="text-sm text-slate-500 mt-1">
            管理系統使用者與權限設定
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>新增使用者</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-center">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 使用者列表 */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">使用者</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">權限</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">職稱</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">區域</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {users.map((user) => {
                const roleInfo = ROLE_LABELS[user.role_type] || ROLE_LABELS.sales;
                const RoleIcon = roleInfo.icon;
                const isCurrentUser = user.id === currentUserProfile?.id;
                
                return (
                  <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${isCurrentUser ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {user.full_name || '未設定'}
                            {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(您)</span>}
                          </p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleInfo.color}`}>
                        <RoleIcon size={12} />
                        <span>{roleInfo.label}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.role || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.region || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => startEditUser(user)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="編輯"
                        >
                          <Pencil size={16} />
                        </button>
                        {!isCurrentUser && (
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="刪除"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-200">
          {users.map((user) => {
            const roleInfo = ROLE_LABELS[user.role_type] || ROLE_LABELS.sales;
            const RoleIcon = roleInfo.icon;
            const isCurrentUser = user.id === currentUserProfile?.id;
            
            return (
              <div key={user.id} className={`p-4 bg-white ${isCurrentUser ? 'bg-blue-50/50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {user.full_name || '未設定'}
                        {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(您)</span>}
                      </p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium border ${roleInfo.color}`}>
                    <RoleIcon size={10} />
                    <span>{roleInfo.label}</span>
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="text-slate-500">
                    {user.role && <span className="mr-3">{user.role}</span>}
                    {user.region && <span>{user.region}</span>}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEditUser(user)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    {!isCurrentUser && (
                      <button
                        onClick={() => setDeletingUser(user)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {users.length === 0 && (
          <div className="p-8 text-center bg-white">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">目前沒有使用者</p>
          </div>
        )}
      </div>

      {/* 新增使用者 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">新增使用者</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm flex items-center">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                  {addError}
                </div>
              )}
              
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-sm">
                <p>新使用者需要透過 Email 驗證後才能登入。</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  密碼 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="至少 6 個字元"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="使用者姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">權限</label>
                <select
                  value={addForm.role_type}
                  onChange={(e) => setAddForm({ ...addForm, role_type: e.target.value as 'sales' | 'manager' | 'admin' })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  <option value="sales">業務 - 只能看自己的資料</option>
                  <option value="manager">經理 - 可看所有人的資料</option>
                  <option value="admin">管理員 - 完整權限</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">職稱</label>
                  <input
                    type="text"
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="業務代表"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">區域</label>
                  <select
                    value={addForm.region}
                    onChange={(e) => setAddForm({ ...addForm, region: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="北區">北區</option>
                    <option value="中區">中區</option>
                    <option value="南區">南區</option>
                    <option value="東區">東區</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddError(null);
                }}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddUser}
                disabled={isAdding}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isAdding ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>新增中...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>新增使用者</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯使用者 Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">編輯使用者</h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">{editingUser.email}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">姓名</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">權限</label>
                <select
                  value={editForm.role_type}
                  onChange={(e) => setEditForm({ ...editForm, role_type: e.target.value as 'sales' | 'manager' | 'admin' })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  disabled={editingUser.id === currentUserProfile?.id}
                >
                  <option value="sales">業務 - 只能看自己的資料</option>
                  <option value="manager">經理 - 可看所有人的資料</option>
                  <option value="admin">管理員 - 完整權限</option>
                </select>
                {editingUser.id === currentUserProfile?.id && (
                  <p className="text-xs text-amber-600 mt-1">無法更改自己的權限</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">職稱</label>
                  <input
                    type="text"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">區域</label>
                  <select
                    value={editForm.region}
                    onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="北區">北區</option>
                    <option value="中區">中區</option>
                    <option value="南區">南區</option>
                    <option value="東區">東區</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isEditing}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isEditing ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>儲存中...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>儲存</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除確認 Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">確定要刪除？</h3>
              <p className="text-sm text-slate-500 text-center">
                您即將刪除 <span className="font-medium text-slate-700">{deletingUser.full_name || deletingUser.email}</span> 的帳號。此操作無法復原。
              </p>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>刪除中...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>確定刪除</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
