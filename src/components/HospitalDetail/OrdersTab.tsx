import React, { useState } from 'react';
import {
    ShoppingCart, X, Check, Edit, Trash2, AlertTriangle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { UsageRecord, ProductType, UsageType, Hospital } from '@/types';
import { PRODUCTS } from '../../constants';

interface OrdersTabProps {
    hospital: Hospital;
    usageHistory: UsageRecord[];
    onAddUsageRecord: (record: UsageRecord) => void;
    onUpdateUsageRecord: (record: UsageRecord) => void;
    onDeleteUsageRecord: (recordId: string) => void;
}

// 自訂下拉箭頭元件
const SelectArrow = () => (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    </div>
);

// 數字輸入的 helper function
const handleNumericInput = (value: string): string => {
    // 移除非數字字元，並移除開頭的 0
    return value.replace(/[^\d]/g, '').replace(/^0+/, '') || '';
};

const OrdersTab: React.FC<OrdersTabProps> = ({
    hospital,
    usageHistory,
    onAddUsageRecord,
    onUpdateUsageRecord,
    onDeleteUsageRecord
}) => {
    // Order Logging State
    const [isLoggingOrder, setIsLoggingOrder] = useState(false);
    const [editingOrder, setEditingOrder] = useState<UsageRecord | null>(null);
    const [orderForm, setOrderForm] = useState({
        productCode: 'AA031',
        date: new Date().toISOString().split('T')[0],
        quantity: '10',
        type: '訂單' as UsageType
    });

    // 刪除確認彈窗狀態
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<UsageRecord | null>(null);

    const handleSaveOrder = () => {
        const quantity = parseInt(orderForm.quantity) || 0;
        if (quantity <= 0) return;
        
        const newOrder: UsageRecord = {
            id: `u-${Date.now()}`,
            hospitalId: hospital.id,
            productCode: orderForm.productCode,
            quantity: quantity,
            date: orderForm.date,
            type: orderForm.type
        };
        onAddUsageRecord(newOrder);
        setIsLoggingOrder(false);
        setOrderForm({
            productCode: 'AA031',
            date: new Date().toISOString().split('T')[0],
            quantity: '10',
            type: '訂單'
        });
    };

    const handleUpdateOrderSubmit = () => {
        if (editingOrder) {
            onUpdateUsageRecord(editingOrder);
            setEditingOrder(null);
        }
    };

    const handleDeleteClick = (record: UsageRecord) => {
        setOrderToDelete(record);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        if (orderToDelete) {
            onDeleteUsageRecord(orderToDelete.id);
            setShowDeleteModal(false);
            setOrderToDelete(null);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* 刪除確認彈窗 */}
            {showDeleteModal && orderToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">刪除訂單記錄</h3>
                                <p className="text-sm text-slate-500">此操作無法復原</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-slate-700">{orderToDelete.productCode}</span>
                                <span className="text-xs text-slate-400">• {orderToDelete.date}</span>
                            </div>
                            <p className="text-sm text-slate-600">
                                數量: <span className="font-bold">{orderToDelete.quantity}</span>
                                <span className="ml-2">類型: {orderToDelete.type || '訂單'}</span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setOrderToDelete(null);
                                }}
                                className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors"
                            >
                                確認刪除
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            <div className="relative">
                                <select
                                    className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm appearance-none cursor-pointer"
                                    value={orderForm.productCode}
                                    onChange={(e) => setOrderForm({ ...orderForm, productCode: e.target.value })}
                                >
                                    {PRODUCTS.filter(p => p.type === ProductType.CONSUMABLE).map(p => (
                                        <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
                                    ))}
                                </select>
                                <SelectArrow />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">日期</label>
                            <input
                                type="date"
                                className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm"
                                value={orderForm.date}
                                onChange={(e) => setOrderForm({ ...orderForm, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">數量</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm"
                                value={orderForm.quantity}
                                onChange={(e) => setOrderForm({ ...orderForm, quantity: handleNumericInput(e.target.value) })}
                                placeholder="輸入數量"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">類型</label>
                            <div className="relative">
                                <select
                                    className="w-full p-3 rounded-xl border-slate-300 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm shadow-sm appearance-none cursor-pointer"
                                    value={orderForm.type}
                                    onChange={(e) => setOrderForm({ ...orderForm, type: e.target.value as UsageType })}
                                >
                                    <option value="訂單">採購訂單</option>
                                    <option value="樣品">樣品 / 展示</option>
                                </select>
                                <SelectArrow />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSaveOrder}
                            disabled={!orderForm.quantity || parseInt(orderForm.quantity) <= 0}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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

                    const groupedUsage = productUsage.reduce((acc, curr) => {
                        const date = curr.date.split('T')[0];
                        if (!acc[date]) {
                            acc[date] = { ...curr, quantity: 0 };
                        }
                        acc[date].quantity += curr.quantity;
                        return acc;
                    }, {} as Record<string, UsageRecord>);

                    const chartData = Object.values(groupedUsage)
                        .sort((a: UsageRecord, b: UsageRecord) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((u: UsageRecord) => ({
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
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                                labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }}
                                            />
                                            <Bar dataKey="quantity" name="數量" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                                        <ShoppingCart size={24} className="mb-2 opacity-50" />
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
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {usageHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => {
                                const product = PRODUCTS.find(p => p.code === record.productCode);
                                const isSample = record.type === '樣品';
                                return (
                                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
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
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setEditingOrder(record)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="編輯"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(record)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="刪除"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {usageHistory.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                                        尚無訂單記錄。點擊「記錄訂單」以新增。
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Order Modal */}
            {editingOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-900 flex items-center">
                                <div className="bg-blue-100 p-1.5 rounded-lg mr-2 text-blue-600"><ShoppingCart size={18} /></div>
                                編輯訂單
                            </h3>
                            <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">產品</label>
                                <div className="relative">
                                    <select
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all appearance-none cursor-pointer"
                                        value={editingOrder.productCode}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, productCode: e.target.value })}
                                    >
                                        {PRODUCTS.filter(p => p.type === ProductType.CONSUMABLE).map(p => (
                                            <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
                                        ))}
                                    </select>
                                    <SelectArrow />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">日期</label>
                                <input
                                    type="date"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={editingOrder.date.split('T')[0]}
                                    onChange={(e) => setEditingOrder({ ...editingOrder, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">數量</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={editingOrder.quantity}
                                    onChange={(e) => {
                                        const value = handleNumericInput(e.target.value);
                                        setEditingOrder({ ...editingOrder, quantity: value ? parseInt(value) : 0 });
                                    }}
                                    placeholder="輸入數量"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">類型</label>
                                <div className="relative">
                                    <select
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all appearance-none cursor-pointer"
                                        value={editingOrder.type}
                                        onChange={(e) => setEditingOrder({ ...editingOrder, type: e.target.value as UsageType })}
                                    >
                                        <option value="訂單">採購訂單</option>
                                        <option value="樣品">樣品 / 展示</option>
                                    </select>
                                    <SelectArrow />
                                </div>
                            </div>

                            <div className="pt-4 flex space-x-3">
                                <button
                                    onClick={handleUpdateOrderSubmit}
                                    disabled={!editingOrder.quantity || editingOrder.quantity <= 0}
                                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    儲存變更
                                </button>
                                <button
                                    onClick={() => setEditingOrder(null)}
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

export default OrdersTab;
