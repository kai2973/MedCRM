import React, { useState } from 'react';
import {
    Wand2, Send, Edit, FileText, X
} from 'lucide-react';
import { Note, ActivityType, Hospital } from '../../types';
import { refineNoteContent } from '../../services/geminiService';

interface NotesTabProps {
    hospital: Hospital;
    notes: Note[];
    onAddNote: (note: Note) => void;
    onUpdateNote: (note: Note) => void;
}

const NotesTab: React.FC<NotesTabProps> = ({
    hospital,
    notes,
    onAddNote,
    onUpdateNote
}) => {
    // Note State
    const [newNoteContent, setNewNoteContent] = useState('');
    const [newNoteActivityType, setNewNoteActivityType] = useState<ActivityType>('拜訪');
    const [isRefining, setIsRefining] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    const handleRefineNote = async () => {
        if (!newNoteContent) return;
        setIsRefining(true);
        try {
            const refined = await refineNoteContent(newNoteContent);
            setNewNoteContent(refined);
        } catch (error) {
            console.error('Error refining note:', error);
        } finally {
            setIsRefining(false);
        }
    };

    const handleCreateNote = () => {
        if (!newNoteContent.trim()) return;

        const newNote: Note = {
            id: `n-${Date.now()}`,
            hospitalId: hospital.id,
            date: new Date().toISOString().split('T')[0],
            content: newNoteContent,
            author: '我',
            activityType: newNoteActivityType
        };

        onAddNote(newNote);
        setNewNoteContent('');
        setNewNoteActivityType('拜訪');
    };

    const handleSaveNote = () => {
        if (editingNote) {
            onUpdateNote(editingNote);
            setEditingNote(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* New Note Input */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                    <Edit size={18} className="mr-2 text-blue-600" />
                    新增活動記錄
                </h3>
                <div className="space-y-4">
                    <div className="flex space-x-4">
                        <select
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            value={newNoteActivityType}
                            onChange={(e) => setNewNoteActivityType(e.target.value as ActivityType)}
                        >
                            <option value="拜訪">拜訪</option>
                            <option value="電話">電話</option>
                            <option value="Email">Email</option>
                            <option value="會議">會議</option>
                        </select>
                        <div className="flex-1 relative">
                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-32 transition-all"
                                placeholder="輸入拜訪內容或備註..."
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                            />
                            <button
                                onClick={handleRefineNote}
                                disabled={isRefining || !newNoteContent}
                                className="absolute bottom-4 right-4 p-2 bg-white text-purple-600 rounded-lg shadow-sm border border-purple-100 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="AI 潤飾內容"
                            >
                                <Wand2 size={16} className={isRefining ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleCreateNote}
                            disabled={!newNoteContent.trim()}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={16} className="mr-2" />
                            發布記錄
                        </button>
                    </div>
                </div>
            </div>

            {/* Notes List */}
            <div className="space-y-4">
                {notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(note => (
                    <div key={note.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-200 transition-all group relative">
                        <button
                            onClick={() => setEditingNote(note)}
                            className="absolute top-4 right-4 text-slate-300 hover:text-blue-600 bg-white p-1.5 rounded-full hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-blue-100"
                        >
                            <Edit size={16} />
                        </button>
                        <div className="flex items-start space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${note.activityType === '拜訪' ? 'bg-blue-100 text-blue-600' :
                                note.activityType === '電話' ? 'bg-green-100 text-green-600' :
                                    note.activityType === 'Email' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-purple-100 text-purple-600'
                                }`}>
                                <FileText size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-bold text-slate-900">{note.activityType}</span>
                                    <span className="text-slate-400 text-sm">•</span>
                                    <span className="text-slate-500 text-sm">{note.date}</span>
                                </div>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            </div>
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

            {/* Edit Note Modal */}
            {editingNote && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-900 flex items-center">
                                <div className="bg-blue-100 p-1.5 rounded-lg mr-2 text-blue-600"><Edit size={18} /></div>
                                編輯記錄
                            </h3>
                            <button onClick={() => setEditingNote(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">類型</label>
                                <select
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                                    value={editingNote.activityType}
                                    onChange={(e) => setEditingNote({ ...editingNote, activityType: e.target.value as ActivityType })}
                                >
                                    <option value="拜訪">拜訪</option>
                                    <option value="電話">電話</option>
                                    <option value="Email">Email</option>
                                    <option value="會議">會議</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">日期</label>
                                <input
                                    type="date"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={editingNote.date}
                                    onChange={(e) => setEditingNote({ ...editingNote, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">內容</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-32 resize-none transition-all"
                                    value={editingNote.content}
                                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
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
    );
};

export default NotesTab;
