import React, { useState } from 'react';
import { LayoutDashboard, Building2, Settings, LogOut, Activity, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { profile, signOut } = useAuth();  // ← 加這行
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: '儀表板', icon: LayoutDashboard },
    { id: 'hospitals', label: '醫院列表', icon: Building2 },
    // { id: 'products', label: '庫存管理', icon: Package }, 
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false); 
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative selection:bg-blue-100">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:relative inset-y-0 left-0 z-[70]
          bg-[#0f172a] text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl
          transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'md:w-72'}
          w-72
        `}
      >
        {/* Brand Header */}
        <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-slate-800/50 bg-[#0f172a]`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-3'} overflow-hidden`}>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Activity size={22} className="text-white" />
            </div>
            {(!isCollapsed || isMobileMenuOpen) && (
              <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap">
                MedSales
              </span>
            )}
          </div>
          
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2 ${isCollapsed ? 'text-center' : ''}`}>
            {isCollapsed ? '選單' : '主選單'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2' : 'space-x-3 px-3.5'
                } py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <Icon size={isCollapsed ? 22 : 20} className={`flex-shrink-0 transition-transform duration-200 ${!isActive && 'group-hover:scale-110'}`} />
                {(!isCollapsed || isMobileMenuOpen) && (
                  <span className={`font-medium whitespace-nowrap overflow-hidden text-sm ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                )}
                
                {/* Collapsed Tooltip */}
                {isCollapsed && !isMobileMenuOpen && (
                  <div className="hidden md:block absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700 transition-opacity duration-150">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
        
        {/* Collapse Toggle */}
        <div className="hidden md:flex px-4 py-3 border-t border-slate-800/50">
             <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full py-2.5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200"
             >
                {isCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center text-xs font-medium"><ChevronLeft size={16} className="mr-2"/> 收合側邊欄</div>} 
             </button>
        </div>

        {/* User Profile / Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-inner flex-shrink-0 cursor-pointer">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            {(!isCollapsed || isMobileMenuOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{profile?.role || '業務代表'}</p>
              </div>
            )}
          </div>
          {/* Footer Actions (Expanded only) */}
           {(!isCollapsed || isMobileMenuOpen) && (
             <div className="mt-4 space-y-1">
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center space-x-3 px-3 py-2 w-full rounded-lg transition-colors text-sm ${activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    <Settings size={16} />
                    <span>設定</span>
                </button>
                <button 
                  onClick={() => signOut()}
                  className="flex items-center space-x-3 px-3 py-2 w-full rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition-colors text-sm"
                >
                    <LogOut size={16} />
                    <span>登出</span>
                </button>
             </div>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative w-full flex flex-col bg-[#f8fafc]">
        {/* Mobile Header */}
        <div className="md:hidden glass-header border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg shadow-sm">
              <Activity size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg tracking-tight">MedSales</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
            <Menu size={24} />
          </button>
        </div>

        <div className="min-h-full">
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;