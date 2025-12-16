import React, { useState, useEffect } from 'react';
import { X, Save, Building } from 'lucide-react';
import { Hospital, HospitalLevel, SalesStage, Region, City } from '../../types';

interface EditHospitalModalProps {
    hospital: Hospital;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedHospital: Hospital) => void;
}

const EditHospitalModal: React.FC<EditHospitalModalProps> = ({
    hospital,
    isOpen,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState<Hospital>(hospital);

    useEffect(() => {
        setFormData(hospital);
    }, [hospital]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    // 自訂下拉箭頭元件
    const SelectArrow = () => (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border border-slate-100 max-h-[90vh] flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center">
                        <div className="bg-blue-100 p-1.5 rounded-lg mr-2 text-blue-600">
                            <Building size={18} />
                        </div>
                        編輯醫院資料
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="edit-hospital-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">醫院名稱</label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">區域</label>
                            <div className="relative">
                                <select
                                    name="region"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all appearance-none cursor-pointer"
                                    value={formData.region}
                                    onChange={handleChange}
                                >
                                    {Object.values(Region).map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                                <SelectArrow />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">等級</label>
                            <div className="relative">
                                <select
                                    name="level"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all appearance-none cursor-pointer"
                                    value={formData.level}
                                    onChange={handleChange}
                                >
                                    {Object.values(HospitalLevel).map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                                <SelectArrow />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">銷售階段</label>
                            <div className="relative">
                                <select
                                    name="stage"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all appearance-none cursor-pointer"
                                    value={formData.stage}
                                    onChange={handleChange}
                                >
                                    {Object.values(SalesStage).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <SelectArrow />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">縣市</label>
                            <div className="relative">
                                <select
                                    name="address"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all appearance-none cursor-pointer"
                                    value={formData.address}
                                    onChange={handleChange}
                                >
                                    <option value="">請選擇縣市</option>
                                    {Object.values(City).map(c => (
                                        <option key={c} value={c}>{c}</option>            
                                    ))}
                                </select>
                                <SelectArrow />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">備註</label>
                            <textarea
                                name="notes"
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-24 resize-none"
                                value={formData.notes || ''}
                                onChange={handleChange}
                                placeholder="輸入備註..."
                            />
                        </div>
                    </form>
                </div>

                <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 shrink-0 flex space-x-3">
                    <button
                        type="submit"
                        form="edit-hospital-form"
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center"
                    >
                        <Save size={18} className="mr-2" />
                        儲存變更
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditHospitalModal;
