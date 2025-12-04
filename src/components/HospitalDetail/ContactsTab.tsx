import React, { useState } from 'react';
import {
    User, Mail, Phone, Sparkles, Edit, X
} from 'lucide-react';
import { Contact, Hospital } from '@/types';
import { generateEmailDraft } from '../../services/geminiService';

interface ContactsTabProps {
    hospital: Hospital;
    contacts: Contact[];
    onAddContact: (contact: Contact) => void;
    onUpdateContact: (contact: Contact) => void;
}

const ContactsTab: React.FC<ContactsTabProps> = ({
    hospital,
    contacts,
    onAddContact,
    onUpdateContact
}) => {
    // Contact Editing State
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [contactForm, setContactForm] = useState({
        name: '',
        role: '',
        email: '',
        phone: '',
        isKeyDecisionMaker: false
    });

    // Email Drafting State
    const [emailDraft, setEmailDraft] = useState<{ content: string, contact: string } | null>(null);
    const [isDraftingEmail, setIsDraftingEmail] = useState(false);

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

    const handleSaveContact = () => {
        if (editingContact) {
            onUpdateContact(editingContact);
            setEditingContact(null);
        }
    };

    const handleAddContactSubmit = () => {
        if (!contactForm.name) return;
        const newContact: Contact = {
            id: `c-${Date.now()}`,
            hospitalId: hospital.id,
            ...contactForm
        };
        onAddContact(newContact);
        setIsAddingContact(false);
        setContactForm({
            name: '',
            role: '',
            email: '',
            phone: '',
            isKeyDecisionMaker: false
        });
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">聯絡人</h3>
                    <p className="text-sm text-slate-500 mt-1">管理醫院的關鍵決策者與聯絡窗口。</p>
                </div>
                {!isAddingContact && (
                    <button
                        onClick={() => setIsAddingContact(true)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]"
                    >
                        <User size={18} />
                        <span className="font-medium">新增聯絡人</span>
                    </button>
                )}
            </div>

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
                                    <span className="font-bold text-slate-700 flex items-center gap-2"><Sparkles size={14} className="text-purple-500" /> AI 草稿</span>
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
                                    onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">職稱</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={editingContact.role}
                                    onChange={(e) => setEditingContact({ ...editingContact, role: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">電子郵件</label>
                                <input
                                    type="email"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={editingContact.email}
                                    onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">電話</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={editingContact.phone}
                                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <input
                                    type="checkbox"
                                    id="decision-maker"
                                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
                                    checked={editingContact.isKeyDecisionMaker}
                                    onChange={(e) => setEditingContact({ ...editingContact, isKeyDecisionMaker: e.target.checked })}
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

            {/* Add Contact Modal */}
            {isAddingContact && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-900 flex items-center">
                                <div className="bg-blue-100 p-1.5 rounded-lg mr-2 text-blue-600"><User size={18} /></div>
                                新增聯絡人
                            </h3>
                            <button onClick={() => setIsAddingContact(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">姓名</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={contactForm.name}
                                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                    placeholder="輸入姓名"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">職稱</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={contactForm.role}
                                    onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                                    placeholder="例如：採購主任"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">電子郵件</label>
                                <input
                                    type="email"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={contactForm.email}
                                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">電話</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={contactForm.phone}
                                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                    placeholder="0912-345-678"
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <input
                                    type="checkbox"
                                    id="new-decision-maker"
                                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
                                    checked={contactForm.isKeyDecisionMaker}
                                    onChange={(e) => setContactForm({ ...contactForm, isKeyDecisionMaker: e.target.checked })}
                                />
                                <label htmlFor="new-decision-maker" className="text-sm text-slate-700 font-medium">關鍵決策者</label>
                            </div>

                            <div className="pt-4 flex space-x-3">
                                <button
                                    onClick={handleAddContactSubmit}
                                    disabled={!contactForm.name}
                                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    新增
                                </button>
                                <button
                                    onClick={() => setIsAddingContact(false)}
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

export default ContactsTab;
