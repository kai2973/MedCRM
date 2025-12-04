
import React, { useState, useEffect } from 'react';
import {
    Wand2, Send, Edit, FileText, X,
    Smile, Meh, Frown, Tag, User as UserIcon, ArrowRightCircle,
    Calendar, Save, Trash2, Plus
} from 'lucide-react';
import { Note, ActivityType, Hospital, Contact, Sentiment } from '@/types';
import { refineNoteContent } from '../../services/geminiService';
import { PRODUCTS } from '../../constants';

interface NotesTabProps {
    hospital: Hospital;
    notes: Note[];
    contacts: Contact[];
    onAddNote: (note: Note) => void;
    onUpdateNote: (note: Note) => void;
}

const NotesTab: React.FC<NotesTabProps> = ({
    hospital,
    notes,
    contacts,
    onAddNote,
    onUpdateNote
}) => {
    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [activityType, setActivityType] = useState<ActivityType>('拜訪');
    const [sentiment, setSentiment] = useState<Sentiment>('neutral');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [nextStep, setNextStep] = useState('');
    const [nextStepDate, setNextStepDate] = useState('');
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
    const [attendees, setAttendees] = useState(''); // Free text for non-contact participants

    const [isRefining, setIsRefining] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // 預設標籤，包含固定選項 + 產品代碼
    const PREDEFINED_TAGS = ['價格異議', '競品比較', '需要報價', '售後服務', '新產品介紹', ...PRODUCTS.map(p => p.code)];

    // Reset form to default state
    const resetForm = () => {
        setEditingId(null);
        setContent('');
        setActivityType('拜訪');
        setSentiment('neutral');
        setSelectedTags([]);
        setNextStep('');
        setNextStepDate('');
        setSelectedContactIds([]);
        setAttendees('');
        setIsExpanded(false);
    };

    // Populate form for editing
    const handleEditClick = (note: Note) => {
        setEditingId(note.id);
        setContent(note.content);
        setActivityType(note.activityType);
        setSentiment(note.sentiment || 'neutral');
        setSelectedTags(note.tags || []);
        setNextStep(note.nextStep || '');
        setNextStepDate(note.nextStepDate || '');
        setSelectedContactIds(note.relatedContactIds || []);
        setAttendees(note.attendees || '');
        setIsExpanded(true);

        // Scroll to top to see the form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefineNote = async () => {
        if (!content) return;
        setIsRefining(true);
        try {
            const refined = await refineNoteContent(content);
            setContent(refined);
        } catch (error) {
            console.error('Error refining note:', error);
        } finally {
            setIsRefining(false);
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const toggleContact = (id: string) => {
        setSelectedContactIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleSubmit = () => {
        if (!content.trim()) return;

        const noteData: any = {
            hospitalId: hospital.id,
            date: editingId ? notes.find(n => n.id === editingId)?.date : new Date().toISOString().split('T')[0], // Keep original date if editing
            content: content,
            author: editingId ? notes.find(n => n.id === editingId)?.author : '我', // Keep original author if editing
            activityType: activityType,
            sentiment,
            tags: selectedTags,
            nextStep: nextStep || undefined,
            nextStepDate: nextStepDate || undefined,
            relatedContactIds: selectedContactIds,
            attendees: attendees || undefined
        };

        if (editingId) {
            onUpdateNote({ ...noteData, id: editingId });
        } else {
            onAddNote({ ...noteData, id: `n-${Date.now()}` });
        }

        resetForm();
    };

    const renderSentimentIcon = (s: Sentiment | undefined, size = 18) => {
        switch (s) {
            case 'positive': return <Smile size={size} className="text-emerald-500" />;
            case 'negative': return <Frown size={size} className="text-red-500" />;
            default: return <Meh size={size} className="text-slate-400" />;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 編輯/新增區塊 */}
            <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all ${isExpanded || editingId ? 'ring-2 ring-blue-100' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900 flex items-center">
                        {editingId ? (
                            <>
                                <Edit size={18} className="mr-2 text-amber-600" />
                                編輯紀錄
                            </>
                        ) : (
                            <>
                                <Plus size={18} className="mr-2 text-blue-600" />
                                新增拜訪紀錄
                            </>
                        )}
                    </h3>

                    {/* Sentiment Selector */}
                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                        {(['positive', 'neutral', 'negative'] as Sentiment[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setSentiment(s)}
                                className={`p-1.5 rounded-md transition-all ${sentiment === s ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-200/50'}`}
                                title={s === 'positive' ? '正向' : s === 'negative' ? '負向' : '中立'}
                            >
                                {renderSentimentIcon(s)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Activity Type & Contacts */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <select
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto min-w-[120px]"
                                value={activityType}
                                onChange={(e) => setActivityType(e.target.value as ActivityType)}
                            >
                                <option value="拜訪">拜訪</option>
                                <option value="電話">電話</option>
                                <option value="Email">Email</option>
                                <option value="會議">會議</option>
                                <option value="展示">展示</option>
                                <option value="教育訓練">教育訓練</option>
                            </select>

                            {/* 聯絡人選擇器 (Chips) */}
                            <div className="flex-1 overflow-x-auto pb-1 flex gap-2 items-center no-scrollbar">
                                <span className="text-xs text-slate-400 font-medium shrink-0 flex items-center">
                                    <UserIcon size={12} className="mr-1" /> 對象:
                                </span>
                                {contacts.length > 0 ? contacts.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => toggleContact(c.id)}
                                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${selectedContactIds.includes(c.id)
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'
                                            }`}
                                    >
                                        {c.name}
                                    </button>
                                )) : (
                                    <span className="text-xs text-slate-400 italic">無聯絡人資料</span>
                                )}
                            </div>
                        </div>

                        {/* 其他參與者 (Free Text) */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium shrink-0">其他參與者:</span>
                            <input
                                type="text"
                                placeholder="輸入其他參與者姓名 (非聯絡人)"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={attendees}
                                onChange={(e) => setAttendees(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="relative">
                        <textarea
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none min-h-[120px] transition-all"
                            placeholder="輸入詳細的拜訪內容、客戶反饋..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onFocus={() => setIsExpanded(true)}
                        />
                        <button
                            onClick={handleRefineNote}
                            disabled={isRefining || !content}
                            className="absolute bottom-4 right-4 p-2 bg-white text-purple-600 rounded-lg shadow-sm border border-purple-100 hover:bg-purple-50 transition-all disabled:opacity-50"
                            title="AI 潤飾內容"
                        >
                            <Wand2 size={16} className={isRefining ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {/* Expanded Options */}
                    {(isExpanded || editingId) && (
                        <div className="space-y-4 pt-2 animate-fade-in border-t border-slate-100 mt-4">
                            {/* Tags */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Tag size={14} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-500 uppercase">標籤</span>
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                                    {PREDEFINED_TAGS.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${selectedTags.includes(tag)
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Next Step */}
                            <div className="flex flex-col md:flex-row gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">下一步行動</label>
                                    <input
                                        type="text"
                                        placeholder="例如：寄送報價單"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={nextStep}
                                        onChange={(e) => setNextStep(e.target.value)}
                                    />
                                </div>
                                <div className="w-full md:w-48">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">截止日期</label>
                                    <input
                                        type="date"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={nextStepDate}
                                        onChange={(e) => setNextStepDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end pt-2 gap-3">
                        {(isExpanded || editingId) && (
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
                            >
                                {editingId ? '取消編輯' : '收起'}
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim()}
                            className={`px-6 py-2.5 rounded-xl font-bold shadow-md flex items-center transition-all active:scale-[0.98] disabled:opacity-50 ${editingId
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                }`}
                        >
                            {editingId ? (
                                <>
                                    <Save size={16} className="mr-2" />
                                    更新紀錄
                                </>
                            ) : (
                                <>
                                    <Send size={16} className="mr-2" />
                                    發布紀錄
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 紀錄列表 */}
            <div className="space-y-4">
                {notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(note => (
                    <div key={note.id} className={`bg-white p-6 rounded-2xl shadow-sm border transition-all group relative ${editingId === note.id ? 'border-amber-400 ring-1 ring-amber-100' : 'border-slate-200 hover:border-blue-200'}`}>
                        {/* 標頭 */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${note.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-600' :
                                    note.sentiment === 'negative' ? 'bg-red-100 text-red-600' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">{note.activityType}</span>
                                        {note.sentiment && renderSentimentIcon(note.sentiment, 14)}
                                    </div>
                                    <span className="text-xs text-slate-400">{new Date(note.date).toLocaleDateString()} • {note.author}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                                    {note.tags?.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md border border-slate-200">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handleEditClick(note)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="編輯"
                                >
                                    <Edit size={14} />
                                </button>
                            </div>
                        </div>

                        {/* 內容區域 */}
                        <div className="pl-[52px]">
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm mb-3">
                                {note.content}
                            </p>

                            {/* 參與者 (Contacts + Attendees) */}
                            {((note.relatedContactIds && note.relatedContactIds.length > 0) || note.attendees) && (
                                <div className="flex items-center gap-2 mb-3">
                                    <UserIcon size={12} className="text-slate-400" />
                                    <div className="flex gap-2 flex-wrap">
                                        {/* Contacts */}
                                        {note.relatedContactIds?.map(cid => {
                                            const contact = contacts.find(c => c.id === cid);
                                            return contact ? (
                                                <span key={cid} className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                    @{contact.name}
                                                </span>
                                            ) : null;
                                        })}
                                        {/* Free Text Attendees */}
                                        {note.attendees && (
                                            <span className="text-xs text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                {note.attendees}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 下一步行動 */}
                            {(note.nextStep || note.nextStepDate) && (
                                <div className="flex items-center gap-3 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50 w-fit mt-2">
                                    <ArrowRightCircle size={14} className="text-amber-500" />
                                    <span className="text-xs font-bold text-amber-700 uppercase">Next:</span>
                                    <span className="text-xs text-slate-700 font-medium">
                                        {note.nextStep}
                                    </span>
                                    {note.nextStepDate && (
                                        <span className="text-xs text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 ml-1">
                                            {note.nextStepDate}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {notes.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500 font-medium">尚無活動記錄</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesTab;