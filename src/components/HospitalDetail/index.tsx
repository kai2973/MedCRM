import React, { useState } from 'react';
import {
    ArrowLeft, MapPin, Edit, Brain, Sparkles, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Hospital, Note, Contact, UsageRecord, SalesStage, InstalledEquipment } from '../../types';
import { PRODUCTS } from '../../constants';
import { generateHospitalInsight } from '../../services/geminiService';

// Sub-components
import OverviewTab from './OverviewTab';
import ContactsTab from './ContactsTab';
import OrdersTab from './OrdersTab';
import NotesTab from './NotesTab';
import EditHospitalModal from './EditHospitalModal';

interface HospitalDetailProps {
    hospital: Hospital;
    notes: Note[];
    contacts: Contact[];
    usageHistory: UsageRecord[];
    onUpdateHospital: (hospital: Hospital) => void;
    onAddNote: (note: Note) => void;
    onUpdateNote: (note: Note) => void;
    onDeleteNote: (noteId: string) => void;
    onUpdateContact: (contact: Contact) => void;
    onAddContact: (contact: Contact) => void;
    onAddUsageRecord: (record: UsageRecord) => void;
    onUpdateUsageRecord: (record: UsageRecord) => void;
    onDeleteUsageRecord: (recordId: string) => void;
    onAddEquipment: (equipment: InstalledEquipment) => Promise<void> | void;
    onUpdateEquipment: (equipment: InstalledEquipment) => Promise<void> | void;
    onDeleteEquipment: (equipmentId: string) => Promise<void> | void;
    onBack: () => void;
    // 新增：醫院導航
    onNavigateToPrev?: () => void;
    onNavigateToNext?: () => void;
    hasPrev?: boolean;
    hasNext?: boolean;
}

const HospitalDetail: React.FC<HospitalDetailProps> = ({
    hospital,
    notes,
    contacts,
    usageHistory,
    onUpdateHospital,
    onAddNote,
    onUpdateNote,
    onDeleteNote,
    onUpdateContact,
    onAddContact,
    onAddUsageRecord,
    onUpdateUsageRecord,
    onDeleteUsageRecord,
    onAddEquipment,
    onUpdateEquipment,
    onDeleteEquipment,
    onBack,
    onNavigateToPrev,
    onNavigateToNext,
    hasPrev = false,
    hasNext = false
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'contacts' | 'notes'>('overview');
    const [insight, setInsight] = useState<string>('');
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    const [isEditingHospital, setIsEditingHospital] = useState(false);
    const [showInsight, setShowInsight] = useState(false);

    const fetchInsight = async () => {
        setShowInsight(true);
        setIsLoadingInsight(true);
        const result = await generateHospitalInsight(hospital, contacts, notes, usageHistory, PRODUCTS);
        setInsight(result);
        setIsLoadingInsight(false);
    };

    const tabNames = {
        'overview': '總覽',
        'orders': '訂單',
        'contacts': '聯絡人',
        'notes': '活動記錄'
    };

    // 階段顏色
    const getStageStyle = (stage: SalesStage) => {
        switch (stage) {
            case SalesStage.KEY_ACCOUNT:
                return 'bg-purple-50 text-purple-700 ring-purple-200';
            case SalesStage.PARTNER:
                return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
            case SalesStage.TRIAL:
                return 'bg-amber-50 text-amber-700 ring-amber-200';
            case SalesStage.CONTACT:
                return 'bg-blue-50 text-blue-700 ring-blue-200';
            default:
                return 'bg-slate-50 text-slate-700 ring-slate-200';
        }
    };

    // 是否顯示導航按鈕
    const showNavigation = hasPrev || hasNext;

    return (
        <div className="flex flex-col h-full bg-slate-50/50 overflow-y-auto relative">
            {/* Header */}
            <div className="glass-header border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-all">
                <div className="flex items-center space-x-3 md:space-x-5 min-w-0">
                    <button onClick={onBack} className="p-2 md:p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm group flex-shrink-0">
                        <ArrowLeft size={20} className="text-slate-500 group-hover:text-blue-600" />
                    </button>
                    
                    {/* 桌面版：左右切換按鈕 */}
                    {showNavigation && (
                        <div className="hidden md:flex items-center">
                            <button 
                                onClick={onNavigateToPrev}
                                disabled={!hasPrev}
                                className={`p-2 rounded-l-xl border border-r-0 transition-all ${
                                    hasPrev 
                                        ? 'bg-white border-slate-200 hover:bg-slate-50 hover:border-blue-300 text-slate-500 hover:text-blue-600' 
                                        : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                                title="上一間醫院"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={onNavigateToNext}
                                disabled={!hasNext}
                                className={`p-2 rounded-r-xl border transition-all ${
                                    hasNext 
                                        ? 'bg-white border-slate-200 hover:bg-slate-50 hover:border-blue-300 text-slate-500 hover:text-blue-600' 
                                        : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                                title="下一間醫院"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 md:gap-3">
                            <h1 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight truncate">{hospital.name}</h1>
                            <span className={`text-xs px-2 md:px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ring-1 ring-inset flex-shrink-0 ${getStageStyle(hospital.stage)}`}>{hospital.stage}</span>
                        </div>
                        <div className="text-xs md:text-sm text-slate-500 flex items-center space-x-2 md:space-x-3 mt-1 md:mt-1.5 font-medium">
                            <span className="flex items-center"><MapPin size={12} className="mr-1" /> {hospital.address || '未設定'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{hospital.level}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                    <button onClick={() => setIsEditingHospital(true)} className="flex items-center space-x-1 md:space-x-2 bg-white border border-slate-200 text-slate-700 px-3 md:px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                        <Edit size={16} /><span className="hidden sm:inline">編輯資料</span>
                    </button>
                </div>
            </div>

            {/* Content - 加入底部 padding 給手機版浮動按鈕留空間 */}
            <div className={`p-4 md:p-6 lg:p-10 max-w-[1400px] mx-auto w-full space-y-6 ${showNavigation ? 'pb-24 md:pb-6' : ''}`}>
                {!showInsight ? (
                    <button
                        onClick={fetchInsight}
                        className="w-full bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200/80 rounded-2xl px-4 md:px-6 py-4 flex items-center justify-between hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 transition-all group"
                    >
                        <div className="flex items-center space-x-3 md:space-x-4">
                            <div className="p-2 md:p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:border-blue-200 group-hover:shadow-md transition-all">
                                <Brain size={20} className="text-slate-500 group-hover:text-blue-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-slate-900 text-sm md:text-base">AI 客戶洞察</h3>
                                <p className="text-xs md:text-sm text-slate-500">分析設備使用與建議下一步行動</p>
                            </div>
                        </div>
                        <span className="bg-white text-blue-600 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold flex items-center space-x-1 md:space-x-2 shadow-sm border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                            <Sparkles size={14} /> <span>生成報告</span>
                        </span>
                    </button>
                ) : (
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200 rounded-2xl p-4 md:p-6 relative">
                        <button onClick={() => setShowInsight(false)} className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 hover:bg-white rounded-lg transition-colors">
                            <X size={18} className="text-slate-400" />
                        </button>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg"><Brain size={18} className="text-blue-600" /></div>
                            <h3 className="font-bold text-slate-900">AI 客戶洞察</h3>
                        </div>
                        {isLoadingInsight ? (
                            <div className="flex items-center space-x-3 text-slate-500 py-4">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                                <span>正在分析客戶資料...</span>
                            </div>
                        ) : (
                            <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">{insight}</div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <nav className="border-b border-slate-200 px-4 md:px-6 flex space-x-4 md:space-x-6 overflow-x-auto">
                        {(Object.keys(tabNames) as Array<keyof typeof tabNames>).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 md:py-4 px-1 md:px-2 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>{tabNames[tab]}</button>
                        ))}
                    </nav>
                </div>

                {activeTab === 'overview' && <OverviewTab hospital={hospital} contacts={contacts} usageHistory={usageHistory} onAddEquipment={onAddEquipment} onUpdateEquipment={onUpdateEquipment} onDeleteEquipment={onDeleteEquipment} onUpdateHospital={onUpdateHospital} />}
                {activeTab === 'orders' && <OrdersTab hospital={hospital} usageHistory={usageHistory} onAddUsageRecord={onAddUsageRecord} onUpdateUsageRecord={onUpdateUsageRecord} onDeleteUsageRecord={onDeleteUsageRecord} />}
                {activeTab === 'contacts' && <ContactsTab hospital={hospital} contacts={contacts} onAddContact={onAddContact} onUpdateContact={onUpdateContact} />}
                {activeTab === 'notes' && <NotesTab hospital={hospital} notes={notes} contacts={contacts} onAddNote={onAddNote} onUpdateNote={onUpdateNote} onDeleteNote={onDeleteNote} onAddContact={onAddContact} />}
            </div>

            {/* 手機版：底部浮動導航按鈕 */}
            {showNavigation && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-lg z-40">
                    <button
                        onClick={onNavigateToPrev}
                        disabled={!hasPrev}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                            hasPrev
                                ? 'bg-slate-100 text-slate-700 active:scale-95'
                                : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                    >
                        <ChevronLeft size={20} />
                        <span>上一間</span>
                    </button>
                    
                    <div className="text-xs text-slate-400 font-medium">
                        切換醫院
                    </div>
                    
                    <button
                        onClick={onNavigateToNext}
                        disabled={!hasNext}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                            hasNext
                                ? 'bg-slate-100 text-slate-700 active:scale-95'
                                : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                    >
                        <span>下一間</span>
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            <EditHospitalModal hospital={hospital} isOpen={isEditingHospital} onClose={() => setIsEditingHospital(false)} onSave={onUpdateHospital} />
        </div>
    );
};

export default HospitalDetail;
