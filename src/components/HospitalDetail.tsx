import React, { useState } from 'react';
import { 
  ArrowLeft, Mail, Phone, FileText, Send, Brain, Sparkles, X, ShoppingCart, Check, Edit, User, Wand2, Calendar, MapPin, Activity, Building2, Plus, Trash2, Package
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Hospital, Note, Contact, UsageRecord, ProductType, SalesStage, UsageType, ActivityType, HospitalLevel, InstalledEquipment } from '../types';
import { PRODUCTS } from '../constants';
import { generateHospitalInsight, generateEmailDraft, refineNoteContent } from '../services/geminiService';

interface HospitalDetailProps {
  hospital: Hospital;
  notes: Note[];
  contacts: Contact[];
  usageHistory: UsageRecord[];
  onUpdateHospital: (hospital: Hospital) => void;
  onAddNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  onUpdateContact: (contact: Contact) => void;
  onAddUsageRecord: (record: UsageRecord) => void;
  onAddEquipment: (equipment: InstalledEquipment) => void;
  onUpdateEquipment: (equipment: InstalledEquipment) => void;
  onDeleteEquipment: (equipmentId: string) => void;
  onBack: () => void;
}

const HospitalDetail: React.FC<HospitalDetailProps> = ({
  hospital,
  notes,
  contacts,
  usageHistory,
  onUpdateHospital,
  onAddNote,
  onUpdateNote,
  onUpdateContact,
  onAddUsageRecord,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'contacts' | 'notes'>('overview');
  const [insight, setInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [emailDraft, setEmailDraft] = useState<{content: string, contact: string} | null>(null);
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);

  // Edit Hospital State
  const [isEditingHospital, setIsEditingHospital] = useState(false);
  const [editHospitalForm, setEditHospitalForm] = useState<Hospital>(hospital);

  // New Note State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteActivityType, setNewNoteActivityType] = useState<ActivityType>('筆記');
  const [isRefining, setIsRefining] = useState(false);

  // Note Editing State
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Contact Editing State
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Order Logging State
  const [isLoggingOrder, setIsLoggingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    productCode: 'AA031',
    date: new Date().toISOString().split('T')[0],
    quantity: 10,
    type: '訂單' as UsageType
  });

  // Equipment State
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<InstalledEquipment | null>(null);
  const [equipmentForm, setEquipmentForm] = useState({
    productCode: 'MR810',
    quantity: 1,
    installDate: new Date().toISOString().split('T')[0],
    ownership: '租賃' as '租賃' | '買斷'
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchInsight = async () => {
    setIsLoadingInsight(true);
    const result = await generateHospitalInsight(hospital, contacts, notes, usageHistory, PRODUCTS);
    setInsight(result);
    setIsLoadingInsight(false);
  };

  const handleRefineNote = async () => {
    if (!newNoteContent.trim()) return;
    setIsRefining(true);
    const refined = await refineNoteContent(newNoteContent);
    setNewNoteContent(refined);
    setIsRefining(false);
  };

  const handleCreateNote = () => {
    if (!newNoteContent.trim()) return;
    const note: Note = {
        id: `n-${Date.now()}`,
        hospitalId: hospital.id,
        content: newNoteContent,
        date: new Date().toISOString(),
        author: '我',
        activityType: newNoteActivityType
    };
    onAddNote(note);
    setNewNoteContent('');
    setNewNoteActivityType('筆記');
  };

  const handleGenerateEmail = async (contact: Contact) => {
    setIsDraftingEmail(true);
    const draft = await generateEmailDraft(
        contact.name, 
        hospital.name, 
        `針對近期互動進行跟進，內容關於${hospital.equipmentInstalled ? '設備效能' : '潛在試用機會'}。目前銷售階段為${hospital.stage}。`,
        'Professional'
    );
    setEmailDraft({ content: draft, contact: contact.name });
    setIsDraftingEmail(false);
  };

  const handleSaveOrder = () => {
    const newOrder: UsageRecord = {
      id: `u-${Date.now()}`,
      hospitalId: hospital.id,
      productCode: orderForm.productCode,
      quantity: Number(orderForm.quantity),
      date: orderForm.date,
      type: orderForm.type
    };
    onAddUsageRecord(newOrder);
    setIsLoggingOrder(false);
    setOrderForm({
      productCode: 'AA031',
      date: new Date().toISOString().split('T')[0],
      quantity: 10,
      type: '訂單'
    });
  };

  // Equipment handlers
  const handleSaveEquipment = () => {
    const newEquipment: InstalledEquipment = {
      id: `eq-${Date.now()}`,
      hospitalId: hospital.id,
      productCode: equipmentForm.productCode,
      quantity: Number(equipmentForm.quantity),
      installDate: equipmentForm.installDate,
      ownership: equipmentForm.ownership
    };
    onAddEquipment(newEquipment);
    setIsAddingEquipment(false);
    setEquipmentForm({
      productCode: 'MR810',
      quantity: 1,
      installDate: new Date().toISOString().split('T')[0],
      ownership: '租賃'
    });
  };

  const handleUpdateEquipment = () => {
    if (!editingEquipment) return;
    onUpdateEquipment(editingEquipment);
    setEditingEquipment(null);
  };

  const handleDeleteEquipment = (id: string) => {
    onDeleteEquipment(id);
    setDeleteConfirmId(null);
  };

  const handleSaveContact = () => {
    if (editingContact) {
      onUpdateContact(editingContact);
      setEditingContact(null);
    }
  };

  const handleSaveNote = () => {
    if (editingNote) {
        onUpdateNote(editingNote);
        setEditingNote(null);
    }
  };

  const handleSaveHospitalDetails = () => {
    onUpdateHospital(editHospitalForm);
    setIsEditingHospital(false);
  };

  const activityTypes: ActivityType[] = ['通話', '會議', '拜訪', '郵件', '筆記', '展示', '教育訓練'];
  
  // 設備產品列表（主機類）
  const equipmentProducts = PRODUCTS.filter(p => p.type === ProductType.EQUIPMENT);
  
  const tabNames = {
      'overview': '總覽',
      'orders': '訂單',
      'contacts': '聯絡人',
      'notes': '活動記錄'
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 overflow-y-auto">
      {/* Premium Sticky Header */}
      <div className="glass-header border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-all">
        <div className="flex items-center space-x-5">
            <button 
                onClick={onBack} 
                className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm group"
            >
                <ArrowLeft size={20} className="text-slate-500 group-hover:text-blue-600" />
            </button>
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {hospital.name}
                    </h1>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ring-1 ring-inset ${
                        hospital.stage === SalesStage.CLOSED_WON ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 
                        hospital.stage === SalesStage.TRIAL ? 'bg-amber-50 text-amber-700 ring-amber-200' : 
                        'bg-blue-50 text-blue-700 ring-blue-200'
                    }`}>
                        {hospital.stage}
                    </span>
                </div>
                <div className="text-sm text-slate-500 flex items-center space-x-3 mt-1.5 font-medium">
                    <span className="flex items-center"><MapPin size={14} className="mr-1"/> {hospital.address}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{hospital.level}</span>
                </div>
            </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center space-x-3">
            <button 
                onClick={() => {
                    setEditHospitalForm(hospital);
                    setIsEditingHospital(true);
                }}
                className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
                <Edit size={16} />
                <span>編輯資料</span>
            </button>
        </div>
      </div>

      <div className="p-6 lg:p-10 max-w-[1400px] mx-auto w-full space-y-8">
        
        {/* AI Insight Section */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-0.5 shadow-xl shadow-indigo-200">
             <div className="bg-white rounded-[14px] p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Sparkles size={120} className="text-indigo-600" />
                 </div>
                 <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-2">
                            <Brain size={18} className="text-indigo-600" />
                            AI 客戶洞察
                        </h3>
                        {!insight && !isLoadingInsight && (
                            <button 
                                onClick={fetchInsight}
                                className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors shadow-sm"
                            >
                                <Sparkles size={16} />
                                <span>生成洞察報告</span>
                            </button>
                        )}
                    </div>
                    
                    {isLoadingInsight && (
                        <div className="animate-pulse flex space-x-4 py-2">
                            <div className="flex-1 space-y-3">
                                <div className="h-2.5 bg-indigo-50 rounded w-3/4"></div>
                                <div className="h-2.5 bg-indigo-50 rounded w-1/2"></div>
                                <div className="h-2.5 bg-indigo-50 rounded w-5/6"></div>
                            </div>
                        </div>
                    )}
                    
                    {insight && !isLoadingInsight && (
                        <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
                            <p className="text-slate-800 text-sm leading-relaxed animate-fade-in whitespace-pre-line font-medium">
                                {insight}
                            </p>
                        </div>
                    )}
                    {!insight && !isLoadingInsight && (
                        <p className="text-slate-500 text-sm italic">使用 AI 分析設備使用情況、聯絡人情緒以及建議的下一步行動。</p>
                    )}
                 </div>
             </div>
        </div>

        {/* Modern Tabs */}
        <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
                {(['overview', 'orders', 'contacts', 'notes'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === tab 
                                ? 'border-blue-600 text-blue-600 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        {tabNames[tab]}
                    </button>
                ))}
            </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
                {/* Equipment Status - 改良版 */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">已安裝設備</h2>
                            <p className="text-sm text-slate-500 mt-1">管理此醫院的設備安裝記錄</p>
                        </div>
                        {!isAddingEquipment && (
                            <button 
                                onClick={() => setIsAddingEquipment(true)}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]"
                            >
                                <Plus size={18} />
                                <span className="font-medium">新增設備</span>
                            </button>
                        )}
                    </div>

                    {/* Add Equipment Form */}
                    {isAddingEquipment && (
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl animate-fade-in relative mb-6">
                            <button 
                                onClick={() => setIsAddingEquipment(false)} 
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm"
                            >
                                <X size={20} />
                            </button>
                            <h4 className="font-bold text-slate-900 mb-5 flex items-center text-lg">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3 text-blue-600">
                                    <Package size={20} />
                                </div>
                                新增設備
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">設備型號</label>
                                    <select 
                                        className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm"
                                        value={equipmentForm.productCode}
                                        onChange={(e) => setEquipmentForm({...equipmentForm, productCode: e.target.value})}
                                    >
                                        {equipmentProducts.map(p => (
                                            <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">數量</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm"
                                        value={equipmentForm.quantity}
                                        onChange={(e) => setEquipmentForm({...equipmentForm, quantity: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">安裝日期</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm"
                                        value={equipmentForm.installDate}
                                        onChange={(e) => setEquipmentForm({...equipmentForm, installDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">所有權</label>
                                    <select 
                                        className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm"
                                        value={equipmentForm.ownership}
                                        onChange={(e) => setEquipmentForm({...equipmentForm, ownership: e.target.value as '租賃' | '買斷'})}
                                    >
                                        <option value="租賃">租賃</option>
                                        <option value="買斷">買斷</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleSaveEquipment}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center transition-all active:scale-[0.98]"
                                >
                                    <Check size={18} className="mr-2" />
                                    儲存設備
                                </button>
                            </div>
                        </div>
                    )}

                    {hospital.installedEquipment.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">產品</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">數量</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">安裝日期</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">所有權</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {hospital.installedEquipment.map(eq => {
                                        const product = PRODUCTS.find(p => p.code === eq.productCode);
                                        return (
                                            <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                    <div className="flex items-center">
                                                        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
                                                            {eq.productCode.substring(0, 2)}
                                                        </span>
                                                        {product?.name || eq.productCode}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{eq.quantity}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{new Date(eq.installDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${eq.ownership === '買斷' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                                        {eq.ownership}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => setEditingEquipment(eq)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setDeleteConfirmId(eq.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Package size={32} className="mx-auto mb-3 text-slate-300" />
                            <p className="text-slate-500 font-medium">尚未安裝設備</p>
                            <p className="text-slate-400 text-sm mt-1">點擊「新增設備」開始記錄</p>
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 lg:p-8">
                     <h3 className="font-bold text-blue-900 mb-4 flex items-center">
                        <Activity size={18} className="mr-2"/> 快速摘要
                     </h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">上次拜訪</p>
                            <p className="font-bold text-slate-900 text-lg">{hospital.lastVisit}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">聯絡人數</p>
                            <p className="font-bold text-slate-900 text-lg">{contacts.length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">未結案機會</p>
                            <p className="font-bold text-slate-900 text-lg">{hospital.stage === SalesStage.CLOSED_WON ? '0' : '1'}</p>
                        </div>
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">今年訂單數</p>
                            <p className="font-bold text-slate-900 text-lg">{usageHistory.filter(u => u.type === '訂單').length}</p>
                        </div>
                     </div>
                </div>
            </div>
        )}

        {activeTab === 'orders' && (
            <div className="space-y-8 animate-fade-in">
                {/* Action Header */}
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">耗材訂單</h3>
                        <p className="text-sm text-slate-500 mt-1">追蹤採購訂單與樣品使用記錄。</p>
                    </div>
                    {!isLoggingOrder && (
                        <button 
                            onClick={() => setIsLoggingOrder(true)}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]"
                        >
                            <ShoppingCart size={18} />
                            <span className="font-medium">記錄訂單</span>
                        </button>
                    )}
                </div>

                {/* Log Order Form */}
                {isLoggingOrder && (
                    <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl animate-fade-in relative shadow-inner">
                        <button 
                            onClick={() => setIsLoggingOrder(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm"
                        >
                            <X size={20} />
                        </button>
                        <h4 className="font-bold text-slate-900 mb-6 flex items-center text-lg">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3 text-blue-600">
                                <ShoppingCart size={20} />
                            </div>
                            記錄新訂單
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">產品</label>
                                <select 
                                    className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm"
                                    value={orderForm.productCode}
                                    onChange={(e) => setOrderForm({...orderForm, productCode: e.target.value})}
                                >
                                    {PRODUCTS.filter(p => p.type === ProductType.CONSUMABLE).map(p => (
                                        <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">日期</label>
                                <input 
                                    type="date" 
                                    className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm"
                                    value={orderForm.date}
                                    onChange={(e) => setOrderForm({...orderForm, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">數量</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm"
                                    value={orderForm.quantity}
                                    onChange={(e) => setOrderForm({...orderForm, quantity: Number(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">類型</label>
                                <select 
                                    className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm"
                                    value={orderForm.type}
                                    onChange={(e) => setOrderForm({...orderForm, type: e.target.value as UsageType})}
                                >
                                    <option value="訂單">採購訂單</option>
                                    <option value="樣品">樣品 / 展示</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button 
                                onClick={handleSaveOrder}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center transition-all active:scale-[0.98]"
                            >
                                <Check size={18} className="mr-2" />
                                儲存記錄
                            </button>
                        </div>
                    </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {PRODUCTS.filter(p => p.type === ProductType.CONSUMABLE).map(product => {
                        const productUsage = usageHistory.filter(u => u.productCode === product.code);
                        const totalPurchased = productUsage
                            .filter(u => u.type === '訂單')
                            .reduce((acc, curr) => acc + curr.quantity, 0);
                        
                        const chartData = [...productUsage]
                            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map(u => ({
                                ...u, 
                                dateLabel: new Date(u.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                            }));
                        
                        return (
                            <div key={product.code} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-w-0">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                            {product.code.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{product.name}</h4>
                                            <p className="text-xs text-slate-500 font-mono">{product.code}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                         <span className="text-2xl font-bold text-slate-900 block">{totalPurchased}</span>
                                         <span className="text-xs text-slate-400 font-medium uppercase">總數量</span>
                                    </div>
                                </div>
                                <div className="h-56 w-full min-w-0 mt-2">
                                    {chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis 
                                                    dataKey="dateLabel" 
                                                    tick={{fontSize: 11, fill: '#64748b'}} 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    tick={{fontSize: 11, fill: '#64748b'}} 
                                                    axisLine={false} 
                                                    tickLine={false}
                                                />
                                                <Tooltip 
                                                    cursor={{fill: '#f8fafc'}}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                                    labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }}
                                                />
                                                <Bar dataKey="quantity" name="數量" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                                            <ShoppingCart size={24} className="mb-2 opacity-50"/>
                                            <span className="text-sm">尚無訂單</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* History Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-900 text-lg">訂單記錄</h3>
                        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">{usageHistory.length} 筆記錄</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">日期</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">產品</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">數量</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">類型</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {usageHistory.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => {
                                    const product = PRODUCTS.find(p => p.code === record.productCode);
                                    const isSample = record.type === '樣品';
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{record.date}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="font-bold text-slate-800 mr-2 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{record.productCode}</span>
                                                <span className="text-slate-500">{product?.name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{record.quantity}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${isSample ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                    {record.type || '訂單'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {usageHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            尚無訂單記錄。點擊「記錄訂單」以新增。
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'contacts' && (
            <div className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contacts.map(contact => (
                        <div key={contact.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all relative group">
                            {/* Edit Button */}
                            <button 
                                onClick={() => setEditingContact(contact)}
                                className="absolute top-4 right-4 text-slate-300 hover:text-blue-600 bg-white p-1.5 rounded-full hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-blue-100"
                            >
                                <Edit size={16} />
                            </button>

                            <div className="flex items-start space-x-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                                    {contact.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900 text-lg">{contact.name}</h3>
                                        {contact.isKeyDecisionMaker && (
                                            <span className="bg-violet-100 text-violet-700 border border-violet-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide">決策者</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-blue-600 font-medium">{contact.role}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3 mb-6 bg-slate-50 rounded-xl p-4">
                                <div className="flex items-center space-x-3 text-sm text-slate-600 group/item hover:text-slate-900 transition-colors">
                                    <Mail size={16} className="text-slate-400 group-hover/item:text-blue-500" />
                                    <span>{contact.email}</span>
                                </div>
                                <div className="flex items-center space-x-3 text-sm text-slate-600 group/item hover:text-slate-900 transition-colors">
                                    <Phone size={16} className="text-slate-400 group-hover/item:text-blue-500" />
                                    <span>{contact.phone}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleGenerateEmail(contact)}
                                disabled={isDraftingEmail}
                                className="w-full flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-[0.98]"
                            >
                                <Sparkles size={16} className={isDraftingEmail ? "animate-spin text-purple-500" : "text-purple-500"} />
                                <span>{isDraftingEmail ? '正在生成郵件...' : 'AI 草擬郵件'}</span>
                            </button>

                            {emailDraft?.contact === contact.name && (
                                <div className="mt-4 bg-slate-50 p-4 rounded-xl text-sm border border-slate-200 animate-fade-in shadow-inner">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold text-slate-700 flex items-center gap-2"><Sparkles size={14} className="text-purple-500"/> AI 草稿</span>
                                        <button onClick={() => setEmailDraft(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                                    </div>
                                    <textarea 
                                        readOnly 
                                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-600 text-xs h-32 focus:outline-none focus:ring-1 focus:ring-purple-200 leading-relaxed resize-none"
                                        value={emailDraft.content}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                    {contacts.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                            <User size={32} className="mx-auto mb-3 opacity-30" />
                            <p>找不到聯絡人。</p>
                        </div>
                    )}
                </div>

                {/* Edit Contact Modal */}
                {editingContact && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-lg text-slate-900 flex items-center">
                                    <div className="bg-blue-100 p-1.5 rounded-lg mr-2 text-blue-600"><User size={18} /></div>
                                    編輯聯絡人
                                </h3>
                                <button onClick={() => setEditingContact(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">姓名</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        value={editingContact.name}
                                        onChange={(e) => setEditingContact({...editingContact, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">職稱</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        value={editingContact.role}
                                        onChange={(e) => setEditingContact({...editingContact, role: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">電子郵件</label>
                                    <input 
                                        type="email" 
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        value={editingContact.email}
                                        onChange={(e) => setEditingContact({...editingContact, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">電話</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        value={editingContact.phone}
                                        onChange={(e) => setEditingContact({...editingContact, phone: e.target.value})}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <input 
                                        type="checkbox" 
                                        id="decision-maker"
                                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
                                        checked={editingContact.isKeyDecisionMaker}
                                        onChange={(e) => setEditingContact({...editingContact, isKeyDecisionMaker: e.target.checked})}
                                    />
                                    <label htmlFor="decision-maker" className="text-sm text-slate-700 font-medium">關鍵決策者</label>
                                </div>

                                <div className="pt-4 flex space-x-3">
                                    <button 
                                        onClick={handleSaveContact}
                                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                                    >
                                        儲存變更
                                    </button>
                                    <button 
                                        onClick={() => setEditingContact(null)}
                                        className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'notes' && (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 text-lg">記錄活動</h3>
                         <div className="flex space-x-2">
                             <button
                                 onClick={handleRefineNote}
                                 disabled={!newNoteContent.trim() || isRefining}
                                 className="text-xs flex items-center space-x-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors border border-purple-100 font-medium"
                             >
                                 <Wand2 size={14} className={isRefining ? "animate-spin" : ""} />
                                 <span>{isRefining ? '潤飾中...' : 'AI 潤飾'}</span>
                             </button>
                         </div>
                    </div>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                活動類型
                            </label>
                            <select
                                className="w-full md:w-1/3 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900 shadow-sm"
                                value={newNoteActivityType}
                                onChange={(e) => setNewNoteActivityType(e.target.value as ActivityType)}
                            >
                                {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
             
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                內容
                            </label>
                            <textarea 
                                className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-900 min-h-[120px] placeholder:text-slate-400"
                                rows={4}
                                placeholder="記錄通話、會議或一般觀察..."
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                            />
                        </div>
                    </div>
             
                     <div className="mt-6 flex justify-end">
                         <button 
                             onClick={handleCreateNote}
                             disabled={!newNoteContent.trim()}
                             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]"
                         >
                             <Send size={18} />
                             <span>儲存記錄</span>
                         </button>
                     </div>
                </div>

                <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200"></div>
                    <div className="space-y-8 relative">
                        {notes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(note => (
                            <div key={note.id} className="ml-14 relative group">
                                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 shadow-sm group-hover:scale-110 transition-transform">
                                    <div className={`w-2.5 h-2.5 rounded-full ${
                                        note.activityType === '會議' ? 'bg-purple-500' :
                                        note.activityType === '通話' ? 'bg-emerald-500' :
                                        'bg-blue-500'
                                    }`}></div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group-hover:border-blue-200 transition-colors relative">
                                    {/* Edit Button */}
                                    <button 
                                        onClick={() => setEditingNote(note)}
                                        className="absolute top-4 right-4 text-slate-300 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit size={16} />
                                    </button>

                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 text-sm">{note.activityType}</h4>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-xs text-slate-500 font-medium">{new Date(note.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                                            {note.author.substring(0,1)}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium">記錄人：{note.author}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {notes.length === 0 && (
                            <div className="text-center py-12 text-slate-400">尚無記錄。</div>
                        )}
                    </div>
                </div>

                {/* Edit Note Modal */}
                {editingNote && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-lg text-slate-900 flex items-center">
                                    <div className="bg-blue-100 p-1.5 rounded-lg mr-2 text-blue-600"><FileText size={18} /></div>
                                    編輯筆記
                                </h3>
                                <button onClick={() => setEditingNote(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">活動類型</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                                        value={editingNote.activityType}
                                        onChange={(e) => setEditingNote({...editingNote, activityType: e.target.value as ActivityType})}
                                    >
                                        {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">內容</label>
                                    <textarea 
                                        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[140px] transition-all"
                                        value={editingNote.content}
                                        onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                                    />
                                </div>
                                
                                <div className="pt-4 flex space-x-3">
                                    <button 
                                        onClick={handleSaveNote}
                                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                                    >
                                        儲存變更
                                    </button>
                                    <button 
                                        onClick={() => setEditingNote(null)}
                                        className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>
      
      {/* Edit Hospital Modal */}
      {isEditingHospital && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-slate-100">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center">
                        <div className="bg-blue-100 p-1.5 rounded-lg mr-2 text-blue-600"><Building2 size={18} /></div>
                        編輯醫院資料
                    </h3>
                    <button onClick={() => setIsEditingHospital(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">醫院名稱</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={editHospitalForm.name}
                            onChange={(e) => setEditHospitalForm({...editHospitalForm, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">區域</label>
                            <select 
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                                value={editHospitalForm.region}
                                onChange={(e) => setEditHospitalForm({...editHospitalForm, region: e.target.value})}
                            >
                                <option value="北區">北區</option>
                                <option value="中區">中區</option>
                                <option value="南區">南區</option>
                                <option value="東區">東區</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">等級</label>
                            <select 
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                                value={editHospitalForm.level}
                                onChange={(e) => setEditHospitalForm({...editHospitalForm, level: e.target.value as HospitalLevel})}
                            >
                                {Object.values(HospitalLevel).map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">地址</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={editHospitalForm.address}
                            onChange={(e) => setEditHospitalForm({...editHospitalForm, address: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">銷售階段</label>
                        <select 
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                            value={editHospitalForm.stage}
                            onChange={(e) => setEditHospitalForm({...editHospitalForm, stage: e.target.value as SalesStage})}
                        >
                            {Object.values(SalesStage).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2 pt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <input 
                            type="checkbox" 
                            id="eq-installed"
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
                            checked={editHospitalForm.equipmentInstalled}
                            onChange={(e) => setEditHospitalForm({...editHospitalForm, equipmentInstalled: e.target.checked})}
                        />
                        <label htmlFor="eq-installed" className="text-sm text-slate-700 font-medium">已安裝 MR810 設備</label>
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <button 
                            onClick={handleSaveHospitalDetails}
                            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                        >
                            儲存變更
                        </button>
                        <button 
                            onClick={() => setIsEditingHospital(false)}
                            className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                        >
                            取消
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {editingEquipment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center">
                        <div className="bg-blue-100 p-1.5 rounded-lg mr-2 text-blue-600"><Package size={18} /></div>
                        編輯設備
                    </h3>
                    <button onClick={() => setEditingEquipment(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">設備型號</label>
                        <select 
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                            value={editingEquipment.productCode}
                            onChange={(e) => setEditingEquipment({...editingEquipment, productCode: e.target.value})}
                        >
                            {equipmentProducts.map(p => (
                                <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">數量</label>
                        <input 
                            type="number" 
                            min="1"
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={editingEquipment.quantity}
                            onChange={(e) => setEditingEquipment({...editingEquipment, quantity: Number(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">安裝日期</label>
                        <input 
                            type="date" 
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={editingEquipment.installDate}
                            onChange={(e) => setEditingEquipment({...editingEquipment, installDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">所有權</label>
                        <select 
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                            value={editingEquipment.ownership}
                            onChange={(e) => setEditingEquipment({...editingEquipment, ownership: e.target.value as '租賃' | '買斷'})}
                        >
                            <option value="租賃">租賃</option>
                            <option value="買斷">買斷</option>
                        </select>
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <button 
                            onClick={handleUpdateEquipment}
                            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                        >
                            儲存變更
                        </button>
                        <button 
                            onClick={() => setEditingEquipment(null)}
                            className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                        >
                            取消
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in border border-slate-100">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">確認刪除設備？</h3>
                    <p className="text-slate-500 text-sm mb-6">此操作無法復原，設備記錄將永久刪除。</p>
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => handleDeleteEquipment(deleteConfirmId)}
                            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-all"
                        >
                            確認刪除
                        </button>
                        <button 
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                        >
                            取消
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDetail;
