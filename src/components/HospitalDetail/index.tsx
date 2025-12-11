import React, { useState } from 'react';
import {
    ArrowLeft, MapPin, Edit, Brain, Sparkles, X
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
    onBack
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

    return (
        <div className="flex flex-col h-full bg-slate-50/50 overflow-y-auto">
            <div className="glass-header border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-all">
                <div className="flex items-center space-x-5">
                    <button onClick={onBack} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm group">
                        <ArrowLeft size={20} className="text-slate-500 group-hover:text-blue-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{hospital.name}</h1>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ring-1 ring-inset ${hospital.stage === SalesStage.CLOSED_WON ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : hospital.stage === SalesStage.TRIAL ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-blue-50 text-blue-700 ring-blue-200'}`}>{hospital.stage}</span>
                        </div>
                        <div className="text-sm text-slate-500 flex items-center space-x-3 mt-1.5 font-medium">
                            <span className="flex items-center"><MapPin size={14} className="mr-1" /> {hospital.address}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{hospital.level}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={() => setIsEditingHospital(true)} className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                        <Edit size={16} /><span>編輯資料</span>
                    </button>
                </div>
            </div>

            <div className="p-6 lg:p-10 max-w-[1400px] mx-auto w-full space-y-6">
                {!showInsight ? (
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl p-[1px]">
                        <div className="bg-white rounded-[11px] px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center"><Brain size={16} className="text-indigo-600" /></div>
                                <div>
                                    <span className="text-sm font-semibold text-slate-900">AI 客戶洞察</span>
                                    <span className="text-xs text-slate-500 ml-2 hidden sm:inline">分析設備使用與建議下一步行動</span>
                                </div>
                            </div>
                            <button onClick={fetchInsight} className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                                <Sparkles size={14} /><span>生成報告</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl p-[1px]">
                        <div className="bg-white rounded-[11px] p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2"><Brain size={16} className="text-indigo-600" /><span className="text-sm font-semibold text-indigo-700">AI 客戶洞察</span></div>
                                <button onClick={() => { setShowInsight(false); setInsight(''); }} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X size={16} /></button>
                            </div>
                            {isLoadingInsight ? (
                                <div className="animate-pulse flex space-x-4 py-1"><div className="flex-1 space-y-2"><div className="h-2 bg-indigo-50 rounded w-3/4"></div><div className="h-2 bg-indigo-50 rounded w-1/2"></div><div className="h-2 bg-indigo-50 rounded w-5/6"></div></div></div>
                            ) : (
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100"><p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{insight}</p></div>
                            )}
                        </div>
                    </div>
                )}

                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8">
                        {(['overview', 'orders', 'contacts', 'notes'] as const).map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>{tabNames[tab]}</button>
                        ))}
                    </nav>
                </div>

                {activeTab === 'overview' && <OverviewTab hospital={hospital} contacts={contacts} usageHistory={usageHistory} onAddEquipment={onAddEquipment} onUpdateEquipment={onUpdateEquipment} onDeleteEquipment={onDeleteEquipment} onUpdateHospital={onUpdateHospital} />}
                {activeTab === 'orders' && <OrdersTab hospital={hospital} usageHistory={usageHistory} onAddUsageRecord={onAddUsageRecord} onUpdateUsageRecord={onUpdateUsageRecord} onDeleteUsageRecord={onDeleteUsageRecord} />}
                {activeTab === 'contacts' && <ContactsTab hospital={hospital} contacts={contacts} onAddContact={onAddContact} onUpdateContact={onUpdateContact} />}
                {activeTab === 'notes' && <NotesTab hospital={hospital} notes={notes} contacts={contacts} onAddNote={onAddNote} onUpdateNote={onUpdateNote} onDeleteNote={onDeleteNote} onAddContact={onAddContact} />}
            </div>

            <EditHospitalModal hospital={hospital} isOpen={isEditingHospital} onClose={() => setIsEditingHospital(false)} onSave={onUpdateHospital} />
        </div>
    );
};

export default HospitalDetail;
