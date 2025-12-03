import React, { useState } from 'react';
import {
    Activity, Plus, X, Package, Check, Edit, Trash2, Loader
} from 'lucide-react';
import { Hospital, Contact, UsageRecord, ProductType, SalesStage, InstalledEquipment } from '../../types';
import { PRODUCTS } from '../../constants';

interface OverviewTabProps {
    hospital: Hospital;
    contacts: Contact[];
    usageHistory: UsageRecord[];
    onAddEquipment: (equipment: InstalledEquipment) => Promise<void> | void;
    onUpdateEquipment: (equipment: InstalledEquipment) => Promise<void> | void;
    onDeleteEquipment: (equipmentId: string) => Promise<void> | void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    hospital,
    contacts,
    usageHistory,
    onAddEquipment,
    onUpdateEquipment,
    onDeleteEquipment
}) => {
    // Equipment State
    const [isAddingEquipment, setIsAddingEquipment] = useState(false);
    const [isSavingEquipment, setIsSavingEquipment] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<InstalledEquipment | null>(null);
    const [equipmentForm, setEquipmentForm] = useState({
        productCode: 'MR810',
        quantity: 1,
        installDate: new Date().toISOString().split('T')[0],
        ownership: '租賃' as '租賃' | '買斷'
    });
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 設備產品列表（主機類）
    const equipmentProducts = PRODUCTS.filter(p => p.type === ProductType.EQUIPMENT);

    // Equipment handlers
    const handleSaveEquipment = async () => {
        setIsSavingEquipment(true);
        try {
            const newEquipment: InstalledEquipment = {
                id: `eq-${Date.now()}`,
                hospitalId: hospital.id,
                productCode: equipmentForm.productCode,
                quantity: Number(equipmentForm.quantity),
                installDate: equipmentForm.installDate,
                ownership: equipmentForm.ownership
            };
            await onAddEquipment(newEquipment);
            setIsAddingEquipment(false);
            setEquipmentForm({
                productCode: 'MR810',
                quantity: 1,
                installDate: new Date().toISOString().split('T')[0],
                ownership: '租賃'
            });
        } catch (error) {
            console.error('Error saving equipment:', error);
        } finally {
            setIsSavingEquipment(false);
        }
    };

    const handleUpdateEquipmentSubmit = async () => {
        if (!editingEquipment) return;
        setIsSavingEquipment(true);
        try {
            await onUpdateEquipment(editingEquipment);
            setEditingEquipment(null);
        } catch (error) {
            console.error('Error updating equipment:', error);
        } finally {
            setIsSavingEquipment(false);
        }
    };

    const handleDeleteEquipment = async (id: string) => {
        setIsDeleting(true);
        try {
            await onDeleteEquipment(id);
            setDeleteConfirmId(null);
        } catch (error) {
            console.error('Error deleting equipment:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
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
                            disabled={isSavingEquipment}
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
                                    onChange={(e) => setEquipmentForm({ ...equipmentForm, productCode: e.target.value })}
                                    disabled={isSavingEquipment}
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
                                    onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity: Number(e.target.value) })}
                                    disabled={isSavingEquipment}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">安裝日期</label>
                                <input
                                    type="date"
                                    className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm"
                                    value={equipmentForm.installDate}
                                    onChange={(e) => setEquipmentForm({ ...equipmentForm, installDate: e.target.value })}
                                    disabled={isSavingEquipment}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">所有權</label>
                                <select
                                    className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm"
                                    value={equipmentForm.ownership}
                                    onChange={(e) => setEquipmentForm({ ...equipmentForm, ownership: e.target.value as '租賃' | '買斷' })}
                                    disabled={isSavingEquipment}
                                >
                                    <option value="租賃">租賃</option>
                                    <option value="買斷">買斷</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveEquipment}
                                disabled={isSavingEquipment}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingEquipment ? (
                                    <>
                                        <Loader size={18} className="mr-2 animate-spin" />
                                        儲存中...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} className="mr-2" />
                                        儲存設備
                                    </>
                                )}
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
                    <Activity size={18} className="mr-2" /> 快速摘要
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

            {/* Edit Equipment Modal */}
            {
                editingEquipment && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-lg text-slate-900 flex items-center">
                                    <div className="bg-blue-100 p-1.5 rounded-lg mr-2 text-blue-600"><Package size={18} /></div>
                                    編輯設備
                                </h3>
                                <button onClick={() => setEditingEquipment(null)} className="text-slate-400 hover:text-slate-600 transition-colors" disabled={isSavingEquipment}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">設備型號</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                                        value={editingEquipment.productCode}
                                        onChange={(e) => setEditingEquipment({ ...editingEquipment, productCode: e.target.value })}
                                        disabled={isSavingEquipment}
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
                                        onChange={(e) => setEditingEquipment({ ...editingEquipment, quantity: Number(e.target.value) })}
                                        disabled={isSavingEquipment}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">安裝日期</label>
                                    <input
                                        type="date"
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        value={editingEquipment.installDate}
                                        onChange={(e) => setEditingEquipment({ ...editingEquipment, installDate: e.target.value })}
                                        disabled={isSavingEquipment}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">所有權</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                                        value={editingEquipment.ownership}
                                        onChange={(e) => setEditingEquipment({ ...editingEquipment, ownership: e.target.value as '租賃' | '買斷' })}
                                        disabled={isSavingEquipment}
                                    >
                                        <option value="租賃">租賃</option>
                                        <option value="買斷">買斷</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex space-x-3">
                                    <button
                                        onClick={handleUpdateEquipmentSubmit}
                                        disabled={isSavingEquipment}
                                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {isSavingEquipment ? (
                                            <>
                                                <Loader size={18} className="mr-2 animate-spin" />
                                                儲存中...
                                            </>
                                        ) : (
                                            '儲存變更'
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setEditingEquipment(null)}
                                        disabled={isSavingEquipment}
                                        className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteConfirmId && (
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
                                        disabled={isDeleting}
                                        className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader size={18} className="mr-2 animate-spin" />
                                                刪除中...
                                            </>
                                        ) : (
                                            '確認刪除'
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        disabled={isDeleting}
                                        className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default OverviewTab;
