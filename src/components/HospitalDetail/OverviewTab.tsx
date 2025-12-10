import React, { useState, useEffect } from 'react';
import {
    Activity, Plus, X, Package, Check, Edit, Trash2, Loader,
    DollarSign, ShoppingBag, Calendar, FileText, AlertTriangle, Clock
} from 'lucide-react';
import { Hospital, Contact, UsageRecord, ProductType, SalesStage, InstalledEquipment, ConsumablePrice, Contract, ContractType, MaintenanceFrequency } from '@/types';
import { PRODUCTS } from '../../constants';
import { fetchContractsByHospital, createContract, updateContract, deleteContract } from '../../services/databaseService';

interface OverviewTabProps {
    hospital: Hospital;
    contacts: Contact[];
    usageHistory: UsageRecord[];
    onAddEquipment: (equipment: InstalledEquipment) => Promise<void> | void;
    onUpdateEquipment: (equipment: InstalledEquipment) => Promise<void> | void;
    onDeleteEquipment: (equipmentId: string) => Promise<void> | void;
    onUpdateHospital?: (hospital: Hospital) => Promise<void> | void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    hospital,
    contacts,
    usageHistory,
    onAddEquipment,
    onUpdateEquipment,
    onDeleteEquipment,
    onUpdateHospital
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

    // 收費與耗材 State
    const [isEditingChargeInfo, setIsEditingChargeInfo] = useState(false);
    const [isSavingChargeInfo, setIsSavingChargeInfo] = useState(false);
    const [chargeForm, setChargeForm] = useState({
        chargePerUse: hospital.chargePerUse?.toString() || '',
        consumables: hospital.consumables || [] as ConsumablePrice[]
    });

    // 合約 State
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoadingContracts, setIsLoadingContracts] = useState(true);
    const [isAddingContract, setIsAddingContract] = useState(false);
    const [isSavingContract, setIsSavingContract] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [deleteContractId, setDeleteContractId] = useState<string | null>(null);
    const [isDeletingContract, setIsDeletingContract] = useState(false);
    const [contractForm, setContractForm] = useState({
        productCode: '',
        contractType: 'consumable' as ContractType,
        startDate: new Date().toISOString().split('T')[0],
        durationYears: 1,
        warrantyYears: 1,
        maintenanceFrequency: 'yearly' as MaintenanceFrequency
    });

    // 載入合約資料
    useEffect(() => {
        const loadContracts = async () => {
            setIsLoadingContracts(true);
            try {
                const data = await fetchContractsByHospital(hospital.id);
                setContracts(data);
            } catch (error) {
                console.error('Error loading contracts:', error);
            } finally {
                setIsLoadingContracts(false);
            }
        };
        loadContracts();
    }, [hospital.id]);

    // 數字輸入的 helper function
    const handleNumericInput = (value: string): string => {
        return value.replace(/[^\d]/g, '').replace(/^0+/, '') || '';
    };

    // 設備產品列表（主機類）
    const equipmentProducts = PRODUCTS.filter(p => p.type === ProductType.EQUIPMENT);
    // 耗材產品列表
    const consumableProducts = PRODUCTS.filter(p => p.type === ProductType.CONSUMABLE);
    // 所有產品
    const allProducts = PRODUCTS;

    // 格式化日期
    const formatLastVisit = (lastVisit: string): string => {
        if (lastVisit === 'Never') return '尚未拜訪';
        try {
            return new Date(lastVisit).toLocaleDateString('zh-TW');
        } catch {
            return lastVisit;
        }
    };

    // 格式化金額
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // 計算合約到期日
    const getContractEndDate = (startDate: string, durationYears: number): Date => {
        const start = new Date(startDate);
        return new Date(start.setFullYear(start.getFullYear() + durationYears));
    };

    // 計算剩餘天數
    const getDaysRemaining = (endDate: Date): number => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = endDate.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // 判斷合約狀態
    const getContractStatus = (contract: Contract): { status: 'active' | 'warning' | 'expired'; label: string; daysRemaining: number } => {
        const endDate = getContractEndDate(contract.startDate, contract.durationYears);
        const daysRemaining = getDaysRemaining(endDate);
        
        if (daysRemaining < 0) {
            return { status: 'expired', label: '已到期', daysRemaining };
        } else if (daysRemaining <= 180) { // 6 個月內到期
            return { status: 'warning', label: `${daysRemaining} 天後到期`, daysRemaining };
        } else {
            return { status: 'active', label: '有效', daysRemaining };
        }
    };

    // 保養頻率文字
    const getMaintenanceFrequencyText = (freq: MaintenanceFrequency): string => {
        const map: Record<MaintenanceFrequency, string> = {
            'yearly': '每年 1 次',
            'biannual': '每半年 1 次',
            'quarterly': '每季 1 次',
            'monthly': '每月 1 次'
        };
        return map[freq] || freq;
    };

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

    // 收費與耗材 handlers
    const handleEditChargeInfo = () => {
        setChargeForm({
            chargePerUse: hospital.chargePerUse?.toString() || '',
            consumables: hospital.consumables || []
        });
        setIsEditingChargeInfo(true);
    };

    const handleSaveChargeInfo = async () => {
        if (!onUpdateHospital) return;
        setIsSavingChargeInfo(true);
        try {
            await onUpdateHospital({
                ...hospital,
                chargePerUse: chargeForm.chargePerUse ? parseInt(chargeForm.chargePerUse) : undefined,
                consumables: chargeForm.consumables.length > 0 ? chargeForm.consumables : undefined
            });
            setIsEditingChargeInfo(false);
        } catch (error) {
            console.error('Error saving charge info:', error);
        } finally {
            setIsSavingChargeInfo(false);
        }
    };

    const toggleConsumable = (code: string) => {
        setChargeForm(prev => {
            const exists = prev.consumables.find(c => c.code === code);
            if (exists) {
                return { ...prev, consumables: prev.consumables.filter(c => c.code !== code) };
            } else {
                return { ...prev, consumables: [...prev.consumables, { code, price: 0 }] };
            }
        });
    };

    const updateConsumablePrice = (code: string, price: string) => {
        setChargeForm(prev => ({
            ...prev,
            consumables: prev.consumables.map(c => c.code === code ? { ...c, price: parseInt(price) || 0 } : c)
        }));
    };

    const isConsumableSelected = (code: string) => chargeForm.consumables.some(c => c.code === code);
    const getConsumablePrice = (code: string) => {
        const item = chargeForm.consumables.find(c => c.code === code);
        return item?.price ? item.price.toString() : '';
    };

    // 合約 handlers
    const handleOpenAddContract = () => {
        const defaultProduct = consumableProducts[0]?.code || equipmentProducts[0]?.code || '';
        setContractForm({
            productCode: defaultProduct,
            contractType: consumableProducts.some(p => p.code === defaultProduct) ? 'consumable' : 'equipment',
            startDate: new Date().toISOString().split('T')[0],
            durationYears: 1,
            warrantyYears: 1,
            maintenanceFrequency: 'yearly'
        });
        setIsAddingContract(true);
    };

    const handleContractProductChange = (code: string) => {
        const product = allProducts.find(p => p.code === code);
        const isEquipment = product?.type === ProductType.EQUIPMENT;
        setContractForm(prev => ({
            ...prev,
            productCode: code,
            contractType: isEquipment ? 'equipment' : 'consumable'
        }));
    };

    const handleSaveContract = async () => {
        if (!contractForm.productCode) return;
        setIsSavingContract(true);
        try {
            const newContract = await createContract({
                hospitalId: hospital.id,
                productCode: contractForm.productCode,
                contractType: contractForm.contractType,
                startDate: contractForm.startDate,
                durationYears: contractForm.durationYears,
                warrantyYears: contractForm.contractType === 'equipment' ? contractForm.warrantyYears : undefined,
                maintenanceFrequency: contractForm.contractType === 'equipment' ? contractForm.maintenanceFrequency : undefined
            });
            if (newContract) {
                setContracts(prev => [newContract, ...prev]);
            }
            setIsAddingContract(false);
        } catch (error) {
            console.error('Error saving contract:', error);
        } finally {
            setIsSavingContract(false);
        }
    };

    const handleEditContract = (contract: Contract) => {
        setContractForm({
            productCode: contract.productCode,
            contractType: contract.contractType,
            startDate: contract.startDate,
            durationYears: contract.durationYears,
            warrantyYears: contract.warrantyYears || 1,
            maintenanceFrequency: contract.maintenanceFrequency || 'yearly'
        });
        setEditingContract(contract);
    };

    const handleUpdateContractSubmit = async () => {
        if (!editingContract) return;
        setIsSavingContract(true);
        try {
            const success = await updateContract({
                ...editingContract,
                productCode: contractForm.productCode,
                contractType: contractForm.contractType,
                startDate: contractForm.startDate,
                durationYears: contractForm.durationYears,
                warrantyYears: contractForm.contractType === 'equipment' ? contractForm.warrantyYears : undefined,
                maintenanceFrequency: contractForm.contractType === 'equipment' ? contractForm.maintenanceFrequency : undefined
            });
            if (success) {
                setContracts(prev => prev.map(c => c.id === editingContract.id ? {
                    ...c,
                    productCode: contractForm.productCode,
                    contractType: contractForm.contractType,
                    startDate: contractForm.startDate,
                    durationYears: contractForm.durationYears,
                    warrantyYears: contractForm.contractType === 'equipment' ? contractForm.warrantyYears : undefined,
                    maintenanceFrequency: contractForm.contractType === 'equipment' ? contractForm.maintenanceFrequency : undefined
                } : c));
            }
            setEditingContract(null);
        } catch (error) {
            console.error('Error updating contract:', error);
        } finally {
            setIsSavingContract(false);
        }
    };

    const handleDeleteContract = async (id: string) => {
        setIsDeletingContract(true);
        try {
            const success = await deleteContract(id);
            if (success) {
                setContracts(prev => prev.filter(c => c.id !== id));
            }
            setDeleteContractId(null);
        } catch (error) {
            console.error('Error deleting contract:', error);
        } finally {
            setIsDeletingContract(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Equipment Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">已安裝設備</h2>
                        <p className="text-sm text-slate-500 mt-1">管理此醫院的設備安裝記錄</p>
                    </div>
                    {!isAddingEquipment && (
                        <button onClick={() => setIsAddingEquipment(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]">
                            <Plus size={18} /><span className="font-medium">新增設備</span>
                        </button>
                    )}
                </div>

                {/* Add Equipment Form */}
                {isAddingEquipment && (
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl animate-fade-in relative mb-6">
                        <button onClick={() => setIsAddingEquipment(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm" disabled={isSavingEquipment}><X size={20} /></button>
                        <h4 className="font-bold text-slate-900 mb-5 flex items-center text-lg">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3 text-blue-600"><Package size={20} /></div>
                            新增設備
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">設備型號</label>
                                <select className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={equipmentForm.productCode} onChange={(e) => setEquipmentForm({ ...equipmentForm, productCode: e.target.value })} disabled={isSavingEquipment}>
                                    {equipmentProducts.map(p => <option key={p.code} value={p.code}>{p.code} - {p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">數量</label>
                                <input type="number" min="1" className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={equipmentForm.quantity} onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity: Number(e.target.value) })} disabled={isSavingEquipment} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">安裝日期</label>
                                <input type="date" className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={equipmentForm.installDate} onChange={(e) => setEquipmentForm({ ...equipmentForm, installDate: e.target.value })} disabled={isSavingEquipment} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">所有權</label>
                                <select className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={equipmentForm.ownership} onChange={(e) => setEquipmentForm({ ...equipmentForm, ownership: e.target.value as '租賃' | '買斷' })} disabled={isSavingEquipment}>
                                    <option value="租賃">租賃</option>
                                    <option value="買斷">買斷</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={handleSaveEquipment} disabled={isSavingEquipment} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center transition-all disabled:opacity-50">
                                {isSavingEquipment ? <><Loader size={18} className="mr-2 animate-spin" />儲存中...</> : <><Check size={18} className="mr-2" />儲存設備</>}
                            </button>
                        </div>
                    </div>
                )}

                {hospital.installedEquipment.length > 0 ? (
                    <>
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">產品</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">數量</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">安裝日期</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">所有權</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {hospital.installedEquipment.map(eq => {
                                        const product = PRODUCTS.find(p => p.code === eq.productCode);
                                        return (
                                            <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                    <div className="flex items-center">
                                                        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">{eq.productCode.substring(0, 2)}</span>
                                                        {product?.name || eq.productCode}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{eq.quantity}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{new Date(eq.installDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${eq.ownership === '買斷' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>{eq.ownership}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setEditingEquipment(eq)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                                        <button onClick={() => setDeleteConfirmId(eq.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="md:hidden space-y-3">
                            {hospital.installedEquipment.map(eq => {
                                const product = PRODUCTS.find(p => p.code === eq.productCode);
                                return (
                                    <div key={eq.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">{eq.productCode.substring(0, 2)}</span>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{product?.name || eq.productCode}</p>
                                                    <p className="text-xs text-slate-500">{eq.productCode}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${eq.ownership === '買斷' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{eq.ownership}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm border-t border-slate-200 pt-3">
                                            <div className="flex gap-4">
                                                <span className="text-slate-500">數量: <span className="text-slate-900 font-medium">{eq.quantity}</span></span>
                                                <span className="text-slate-500 flex items-center"><Calendar size={12} className="mr-1" />{new Date(eq.installDate).toLocaleDateString('zh-TW')}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => setEditingEquipment(eq)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                                <button onClick={() => setDeleteConfirmId(eq.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Package size={32} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500 font-medium">尚未安裝設備</p>
                        <p className="text-slate-400 text-sm mt-1">點擊「新增設備」開始記錄</p>
                    </div>
                )}
            </div>

            {/* 收費與耗材區塊 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">收費與耗材</h2>
                        <p className="text-sm text-slate-500 mt-1">此醫院的收費標準與使用耗材</p>
                    </div>
                    {!isEditingChargeInfo && onUpdateHospital && (
                        <button onClick={handleEditChargeInfo} className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all">
                            <Edit size={16} /><span className="font-medium text-sm">編輯</span>
                        </button>
                    )}
                </div>

                {isEditingChargeInfo ? (
                    <div className="space-y-5 animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">每次收費價格 (NT$)</label>
                            <input type="text" inputMode="numeric" className="w-full md:w-64 p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={chargeForm.chargePerUse} onChange={(e) => setChargeForm({ ...chargeForm, chargePerUse: handleNumericInput(e.target.value) })} placeholder="例如: 1500" disabled={isSavingChargeInfo} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">使用耗材（點擊選擇，並填入售價）</label>
                            <div className="space-y-2">
                                {consumableProducts.map(p => {
                                    const isSelected = isConsumableSelected(p.code);
                                    return (
                                        <div key={p.code} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                            <button onClick={() => toggleConsumable(p.code)} disabled={isSavingChargeInfo} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'} disabled:opacity-50`}>
                                                {isSelected && <Check size={14} />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm font-medium ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>{p.code}</span>
                                                <span className="text-xs text-slate-500 ml-2">{p.name}</span>
                                            </div>
                                            {isSelected && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">NT$</span>
                                                    <input type="text" inputMode="numeric" className="w-24 p-2 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm" value={getConsumablePrice(p.code)} onChange={(e) => updateConsumablePrice(p.code, handleNumericInput(e.target.value))} placeholder="售價" disabled={isSavingChargeInfo} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setIsEditingChargeInfo(false)} disabled={isSavingChargeInfo} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-medium disabled:opacity-50">取消</button>
                            <button onClick={handleSaveChargeInfo} disabled={isSavingChargeInfo} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center disabled:opacity-50">
                                {isSavingChargeInfo ? <><Loader size={18} className="mr-2 animate-spin" />儲存中...</> : <><Check size={18} className="mr-2" />儲存</>}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><DollarSign size={20} /></div>
                                <div>
                                    <p className="text-xs text-slate-500 font-semibold uppercase">每次收費</p>
                                    <p className="font-bold text-slate-900 text-lg">{hospital.chargePerUse ? formatCurrency(hospital.chargePerUse) : '尚未設定'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><ShoppingBag size={20} /></div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-500 font-semibold uppercase mb-2">使用耗材</p>
                                    {hospital.consumables && hospital.consumables.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {hospital.consumables.map(item => {
                                                const product = consumableProducts.find(p => p.code === item.code);
                                                return (
                                                    <div key={item.code} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-slate-700">{item.code}</span>
                                                            <span className="text-xs text-slate-400">{product?.name}</span>
                                                        </div>
                                                        <span className="text-sm font-semibold text-emerald-600">{item.price ? formatCurrency(item.price) : '-'}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-sm">尚未設定</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 合約管理區塊 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">合約管理</h2>
                        <p className="text-sm text-slate-500 mt-1">追蹤設備與耗材的合約狀態</p>
                    </div>
                    {!isAddingContract && (
                        <button onClick={handleOpenAddContract} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]">
                            <Plus size={18} /><span className="font-medium">新增合約</span>
                        </button>
                    )}
                </div>

                {/* Add Contract Form */}
                {isAddingContract && (
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl animate-fade-in relative mb-6">
                        <button onClick={() => setIsAddingContract(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm" disabled={isSavingContract}><X size={20} /></button>
                        <h4 className="font-bold text-slate-900 mb-5 flex items-center text-lg">
                            <div className="bg-purple-100 p-2 rounded-lg mr-3 text-purple-600"><FileText size={20} /></div>
                            新增合約
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">產品</label>
                                <select className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={contractForm.productCode} onChange={(e) => handleContractProductChange(e.target.value)} disabled={isSavingContract}>
                                    <optgroup label="設備">
                                        {equipmentProducts.map(p => <option key={p.code} value={p.code}>{p.code} - {p.name}</option>)}
                                    </optgroup>
                                    <optgroup label="耗材">
                                        {consumableProducts.map(p => <option key={p.code} value={p.code}>{p.code} - {p.name}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">合約開始日</label>
                                <input type="date" className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={contractForm.startDate} onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })} disabled={isSavingContract} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">合約年限</label>
                                <select className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={contractForm.durationYears} onChange={(e) => setContractForm({ ...contractForm, durationYears: Number(e.target.value) })} disabled={isSavingContract}>
                                    {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} 年</option>)}
                                </select>
                            </div>
                            {contractForm.contractType === 'equipment' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">保固年限</label>
                                        <select className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={contractForm.warrantyYears} onChange={(e) => setContractForm({ ...contractForm, warrantyYears: Number(e.target.value) })} disabled={isSavingContract}>
                                            {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} 年</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">保養頻率</label>
                                        <select className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={contractForm.maintenanceFrequency} onChange={(e) => setContractForm({ ...contractForm, maintenanceFrequency: e.target.value as MaintenanceFrequency })} disabled={isSavingContract}>
                                            <option value="yearly">每年 1 次</option>
                                            <option value="biannual">每半年 1 次</option>
                                            <option value="quarterly">每季 1 次</option>
                                            <option value="monthly">每月 1 次</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button onClick={handleSaveContract} disabled={isSavingContract || !contractForm.productCode} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center transition-all disabled:opacity-50">
                                {isSavingContract ? <><Loader size={18} className="mr-2 animate-spin" />儲存中...</> : <><Check size={18} className="mr-2" />儲存合約</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* Contract List */}
                {isLoadingContracts ? (
                    <div className="text-center py-12">
                        <Loader size={32} className="mx-auto mb-3 text-slate-300 animate-spin" />
                        <p className="text-slate-500">載入合約資料中...</p>
                    </div>
                ) : contracts.length > 0 ? (
                    <div className="space-y-3">
                        {contracts.map(contract => {
                            const product = allProducts.find(p => p.code === contract.productCode);
                            const status = getContractStatus(contract);
                            const endDate = getContractEndDate(contract.startDate, contract.durationYears);
                            const isEquipment = contract.contractType === 'equipment';

                            return (
                                <div key={contract.id} className={`p-4 rounded-xl border transition-all group ${status.status === 'expired' ? 'bg-red-50 border-red-200' : status.status === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${isEquipment ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {contract.productCode.substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-slate-900">{product?.name || contract.productCode}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isEquipment ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {isEquipment ? '設備' : '耗材'}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${status.status === 'expired' ? 'bg-red-100 text-red-700' : status.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {status.status === 'warning' && <AlertTriangle size={12} />}
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {new Date(contract.startDate).toLocaleDateString('zh-TW')} ~ {endDate.toLocaleDateString('zh-TW')}
                                                    </span>
                                                    <span>合約 {contract.durationYears} 年</span>
                                                    {isEquipment && contract.warrantyYears && (
                                                        <span>保固 {contract.warrantyYears} 年</span>
                                                    )}
                                                    {isEquipment && contract.maintenanceFrequency && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={14} />
                                                            {getMaintenanceFrequencyText(contract.maintenanceFrequency)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditContract(contract)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                            <button onClick={() => setDeleteContractId(contract.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500 font-medium">尚無合約記錄</p>
                        <p className="text-slate-400 text-sm mt-1">點擊「新增合約」開始記錄</p>
                    </div>
                )}
            </div>

            {/* 快速摘要 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 lg:p-8">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center"><Activity size={18} className="mr-2" /> 快速摘要</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-1">上次拜訪</p>
                        <p className="font-bold text-slate-900 text-lg">{formatLastVisit(hospital.lastVisit)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-1">聯絡人數</p>
                        <p className="font-bold text-slate-900 text-lg">{contacts.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-1">未結案機會</p>
                        <p className="font-bold text-slate-900 text-lg">{hospital.stage === SalesStage.CLOSED_WON ? '0' : '1'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-1">今年訂單數</p>
                        <p className="font-bold text-slate-900 text-lg">{usageHistory.filter(u => u.type === '訂單').length}</p>
                    </div>
                </div>
            </div>

            {/* Edit Equipment Modal */}
            {editingEquipment && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-900 flex items-center">
                                <div className="bg-blue-100 p-1.5 rounded-lg mr-2 text-blue-600"><Package size={18} /></div>
                                編輯設備
                            </h3>
                            <button onClick={() => setEditingEquipment(null)} className="text-slate-400 hover:text-slate-600" disabled={isSavingEquipment}><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">設備型號</label>
                                <select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editingEquipment.productCode} onChange={(e) => setEditingEquipment({ ...editingEquipment, productCode: e.target.value })} disabled={isSavingEquipment}>
                                    {equipmentProducts.map(p => <option key={p.code} value={p.code}>{p.code} - {p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">數量</label>
                                <input type="number" min="1" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={editingEquipment.quantity} onChange={(e) => setEditingEquipment({ ...editingEquipment, quantity: Number(e.target.value) })} disabled={isSavingEquipment} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">安裝日期</label>
                                <input type="date" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={editingEquipment.installDate} onChange={(e) => setEditingEquipment({ ...editingEquipment, installDate: e.target.value })} disabled={isSavingEquipment} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">所有權</label>
                                <select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editingEquipment.ownership} onChange={(e) => setEditingEquipment({ ...editingEquipment, ownership: e.target.value as '租賃' | '買斷' })} disabled={isSavingEquipment}>
                                    <option value="租賃">租賃</option>
                                    <option value="買斷">買斷</option>
                                </select>
                            </div>
                            <div className="pt-4 flex space-x-3">
                                <button onClick={handleUpdateEquipmentSubmit} disabled={isSavingEquipment} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">
                                    {isSavingEquipment ? <><Loader size={18} className="mr-2 animate-spin" />儲存中...</> : '儲存變更'}
                                </button>
                                <button onClick={() => setEditingEquipment(null)} disabled={isSavingEquipment} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-50">取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Contract Modal */}
            {editingContract && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-slate-100">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-900 flex items-center">
                                <div className="bg-purple-100 p-1.5 rounded-lg mr-2 text-purple-600"><FileText size={18} /></div>
                                編輯合約
                            </h3>
                            <button onClick={() => setEditingContract(null)} className="text-slate-400 hover:text-slate-600" disabled={isSavingContract}><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">產品</label>
                                <select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={contractForm.productCode} onChange={(e) => handleContractProductChange(e.target.value)} disabled={isSavingContract}>
                                    <optgroup label="設備">
                                        {equipmentProducts.map(p => <option key={p.code} value={p.code}>{p.code} - {p.name}</option>)}
                                    </optgroup>
                                    <optgroup label="耗材">
                                        {consumableProducts.map(p => <option key={p.code} value={p.code}>{p.code} - {p.name}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">合約開始日</label>
                                    <input type="date" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={contractForm.startDate} onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })} disabled={isSavingContract} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">合約年限</label>
                                    <select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={contractForm.durationYears} onChange={(e) => setContractForm({ ...contractForm, durationYears: Number(e.target.value) })} disabled={isSavingContract}>
                                        {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} 年</option>)}
                                    </select>
                                </div>
                            </div>
                            {contractForm.contractType === 'equipment' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">保固年限</label>
                                        <select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={contractForm.warrantyYears} onChange={(e) => setContractForm({ ...contractForm, warrantyYears: Number(e.target.value) })} disabled={isSavingContract}>
                                            {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} 年</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">保養頻率</label>
                                        <select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={contractForm.maintenanceFrequency} onChange={(e) => setContractForm({ ...contractForm, maintenanceFrequency: e.target.value as MaintenanceFrequency })} disabled={isSavingContract}>
                                            <option value="yearly">每年 1 次</option>
                                            <option value="biannual">每半年 1 次</option>
                                            <option value="quarterly">每季 1 次</option>
                                            <option value="monthly">每月 1 次</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            <div className="pt-4 flex space-x-3">
                                <button onClick={handleUpdateContractSubmit} disabled={isSavingContract} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">
                                    {isSavingContract ? <><Loader size={18} className="mr-2 animate-spin" />儲存中...</> : '儲存變更'}
                                </button>
                                <button onClick={() => setEditingContract(null)} disabled={isSavingContract} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-50">取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Equipment Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in border border-slate-100">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4"><Trash2 size={24} /></div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">確認刪除設備？</h3>
                            <p className="text-slate-500 text-sm mb-6">此操作無法復原，設備記錄將永久刪除。</p>
                            <div className="flex space-x-3">
                                <button onClick={() => handleDeleteEquipment(deleteConfirmId)} disabled={isDeleting} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center">
                                    {isDeleting ? <><Loader size={18} className="mr-2 animate-spin" />刪除中...</> : '確認刪除'}
                                </button>
                                <button onClick={() => setDeleteConfirmId(null)} disabled={isDeleting} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-50">取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Contract Confirmation Modal */}
            {deleteContractId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in border border-slate-100">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4"><Trash2 size={24} /></div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">確認刪除合約？</h3>
                            <p className="text-slate-500 text-sm mb-6">此操作無法復原，合約記錄將永久刪除。</p>
                            <div className="flex space-x-3">
                                <button onClick={() => handleDeleteContract(deleteContractId)} disabled={isDeletingContract} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center">
                                    {isDeletingContract ? <><Loader size={18} className="mr-2 animate-spin" />刪除中...</> : '確認刪除'}
                                </button>
                                <button onClick={() => setDeleteContractId(null)} disabled={isDeletingContract} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-50">取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverviewTab;
