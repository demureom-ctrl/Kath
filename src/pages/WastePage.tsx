// ==========================================
// Waste Page - Track & Manage Waste
// ==========================================

import { useState } from 'react';
import { Header } from '../components/Layout';
import { useWaste, WasteType } from '../context/WasteContext';
import { useProducts } from '../context/ProductsContext';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency } from '../utils/calculations';
import { getProductIcon } from '../utils/productIcons';

export function WastePage() {
    const { wasteLogs, addWasteLog } = useWaste();
    const { products } = useProducts();
    const { ingredients } = useInventory();

    const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');

    // Form State
    const [wasteType, setWasteType] = useState<WasteType>('product');
    const [selectedId, setSelectedId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedId) {
            setError('الرجاء اختيار العنصر');
            return;
        }

        if (!quantity || Number(quantity) <= 0) {
            setError('الكمية يجب أن تكون أكبر من صفر');
            return;
        }

        if (!reason.trim()) {
            setError('الرجاء كتابة سبب الهدر');
            return;
        }

        const result = await addWasteLog(wasteType, selectedId, Number(quantity), reason);

        if (result.success) {
            setSuccess('تم تسجيل الهدر بنجاح');
            // Reset form
            setSelectedId('');
            setQuantity('1');
            setReason('');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error || 'حدث خطأ ما');
        }
    };

    // Format full date
    const formatFullDate = (date: Date) => {
        return new Intl.DateTimeFormat('ar-OM', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    return (
        <div className="flex flex-col h-screen pb-20">
            <Header
                title="إدارة الهدر"
                subtitle="تسجيل ومتابعة التالف والهدر"
            />

            <div className="flex-1 px-4 overflow-y-auto">
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('record')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'record'
                            ? 'bg-[#556c33] text-white shadow-lg scale-105'
                            : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        📝 تسجيل هدر جديد
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'history'
                            ? 'bg-[#556c33] text-white shadow-lg scale-105'
                            : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        📋 سجل الهدر
                    </button>
                </div>

                {activeTab === 'record' && (
                    <div className="animate-fade-in space-y-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">

                            {/* Type Toggle */}
                            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                                <button
                                    onClick={() => { setWasteType('product'); setSelectedId(''); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${wasteType === 'product'
                                        ? 'bg-white text-[#556c33] shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    ☕ منتج جهاز
                                </button>
                                <button
                                    onClick={() => { setWasteType('ingredient'); setSelectedId(''); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${wasteType === 'ingredient'
                                        ? 'bg-white text-[#556c33] shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    📦 مادة خام
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Item Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        اختر {wasteType === 'product' ? 'المنتج' : 'المادة الخام'}
                                    </label>
                                    <select
                                        value={selectedId}
                                        onChange={(e) => setSelectedId(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#556c33] transition-shadow"
                                    >
                                        <option value="">-- اختر --</option>
                                        {wasteType === 'product' ? (
                                            products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))
                                        ) : (
                                            ingredients.map(i => (
                                                <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        الكمية التالفة
                                    </label>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#556c33] transition-shadow"
                                    />
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        سبب الهدر
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        placeholder="مثال: انتهاء الصلاحية / سقط على الأرض..."
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#556c33] transition-shadow"
                                    />
                                </div>

                                {/* Messages */}
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                                        ⚠️ {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100 flex items-center gap-2">
                                        ✅ {success}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                                >
                                    🗑️ تسجيل الهدر
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-2">
                                    * سيتم خصم الكمية من المخزون وحساب التكلفة تلقائياً
                                </p>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="animate-fade-in space-y-4">
                        {wasteLogs.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    ✨
                                </div>
                                <p className="text-gray-500 font-medium">سجل الهدر نظيف!</p>
                            </div>
                        ) : (
                            wasteLogs.map((log) => (
                                <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-start gap-4 hover:shadow-md transition-shadow">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${log.type === 'product' ? 'bg-[#556c33]/10' : 'bg-blue-50'
                                        }`}>
                                        {log.type === 'product'
                                            ? <span className="filter drop-shadow-sm">{getProductIcon(log.itemName)}</span>
                                            : '📦'
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-gray-900 truncate pr-2">{log.itemName}</h3>
                                            <span className="text-red-600 font-bold text-sm bg-red-50 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                                -{formatCurrency(log.cost)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mb-2">
                                            <span>🔢 الكمية: <span className="text-gray-900 font-medium">{log.quantity} {log.unit}</span></span>
                                            <span>👤 {log.userName}</span>
                                        </div>
                                        <div className="text-sm bg-gray-50 p-2 rounded-lg text-gray-700 border border-gray-100">
                                            📝 {log.reason}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-2 text-left" dir="ltr">
                                            {formatFullDate(log.date)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default WastePage;
