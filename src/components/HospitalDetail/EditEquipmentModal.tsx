import React, { useState, useEffect } from 'react';
import { X, Package, Loader } from 'lucide-react';
import { InstalledEquipment, ProductType } from '../../types';
import { PRODUCTS } from '../../constants';

interface EditEquipmentModalProps {
    equipment: InstalledEquipment | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedEquipment: InstalledEquipment) => Promise<void> | void;
}

const EditEquipmentModal: React.FC<EditEquipmentModalProps> = ({
    equipment,
    isOpen,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState<InstalledEquipment | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // 設備產品列表（主機類）
    const equipmentProducts = PRODUCTS.filter(p => p.type === ProductType.EQUIPMENT);

    useEffect(() => {
        if (equipment) {
            setFormData({ ...equipment });
        }
    }, [equipment]);

    const handleSave = async () => {
        if (!formData) return;
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error updating equipment:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !formData) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center">
                        <div className="bg-blue-100 p-1.5 rounded-lg mr-2 text-blue-600"><Package size={18} /></div>
                        編輯設備
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" disabled={isSaving}>
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">設備型號</label>
                        <select
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                            value={formData.productCode}
                            onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                            disabled={isSaving}
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
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                            disabled={isSaving}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">安裝日期</label>
                        <input
                            type="date"
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={formData.installDate}
                            onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                            disabled={isSaving}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">所有權</label>
                        <select
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                            value={formData.ownership}
                            onChange={(e) => setFormData({ ...formData, ownership: e.target.value as '租賃' | '買斷' })}
                            disabled={isSaving}
                        >
                            <option value="租賃">租賃</option>
                            <option value="買斷">買斷</option>
                        </select>
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSaving ? (
                                <>
                                    <Loader size={18} className="mr-2 animate-spin" />
                                    儲存中...
                                </>
                            ) : (
                                '儲存變更'
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            取消
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditEquipmentModal;
