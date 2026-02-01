// ==========================================
// Reports Page - Sales & Alerts - Light Theme
// ==========================================

import { useState, useMemo } from 'react';
import { Header } from '../components/Layout';
import { useSales } from '../context/SalesContext';
import { useWaste } from '../context/WasteContext';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatDate } from '../utils/calculations';

type DateFilter = 'today' | 'week' | 'month' | 'custom' | 'all';

export function ReportsPage() {
    const { sales, loading } = useSales();
    const { wasteLogs } = useWaste();
    const { lowStockAlerts, purchases } = useInventory(); // Get purchases
    const [dateFilter, setDateFilter] = useState<DateFilter>('today');
    const [activeTab, setActiveTab] = useState<'sales' | 'alerts' | 'expenses'>('sales'); // Added expenses tab

    // Custom date range
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Common date filtering logic
    const filterByDate = (date: Date) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const itemDate = new Date(date);

        switch (dateFilter) {
            case 'today':
                return itemDate >= today;
            case 'week':
                return itemDate >= weekAgo;
            case 'month':
                return itemDate >= monthAgo;
            case 'custom':
                if (fromDate && toDate) {
                    const from = new Date(fromDate);
                    const to = new Date(toDate);
                    to.setHours(23, 59, 59, 999);
                    return itemDate >= from && itemDate <= to;
                }
                return true;
            default:
                return true;
        }
    };

    // Filter sales
    const filteredSales = useMemo(() => {
        return sales.filter(sale => filterByDate(sale.date));
    }, [sales, dateFilter, fromDate, toDate]);

    // Filter waste
    const filteredWaste = useMemo(() => {
        return wasteLogs.filter(log => filterByDate(log.date));
    }, [wasteLogs, dateFilter, fromDate, toDate]);

    // Filter purchases
    const filteredPurchases = useMemo(() => {
        return purchases.filter(p => filterByDate(p.date));
    }, [purchases, dateFilter, fromDate, toDate]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalSales = filteredSales.length;
        const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;

        // Calculate total items
        const totalItems = filteredSales.reduce((sum, sale) =>
            sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        );

        // Waste stats
        const totalWaste = filteredWaste.reduce((sum, log) => sum + log.cost, 0);
        const wasteCount = filteredWaste.length;

        // Purchases stats
        const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.cost, 0);

        // Payment method breakdown
        const cashSales = filteredSales.filter(s => s.paymentMethod === 'cash');
        const cardSales = filteredSales.filter(s => s.paymentMethod === 'card');

        const totalCash = cashSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalCard = cardSales.reduce((sum, sale) => sum + sale.total, 0);
        const cashCount = cashSales.length;
        const cardCount = cardSales.length;

        const netProfit = totalRevenue - totalWaste - totalPurchases;

        return {
            totalRevenue, totalSales, avgSale, totalItems,
            totalWaste, wasteCount, netProfit,
            totalCash, totalCard, cashCount, cardCount,
            totalPurchases,
        };
    }, [filteredSales, filteredWaste, filteredPurchases]);

    const handleCustomDateSelect = () => {
        if (fromDate && toDate) {
            setDateFilter('custom');
            setShowDatePicker(false);
        }
    };

    const clearCustomDate = () => {
        setFromDate('');
        setToDate('');
        setDateFilter('today');
    };

    return (
        <div className="flex flex-col h-screen pb-20">
            <Header
                title="التقارير"
                subtitle="ملخص المبيعات والأداء"
            />

            <div className="flex-1 px-4 overflow-y-auto">
                {/* Date Filter - Quick options */}
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {(['today', 'week', 'month', 'all'] as DateFilter[]).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => {
                                setDateFilter(filter);
                                if (filter !== 'custom') {
                                    setFromDate('');
                                    setToDate('');
                                }
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${dateFilter === filter
                                ? 'bg-[#556c33] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {filter === 'today' ? 'اليوم' : filter === 'week' ? 'الأسبوع' : filter === 'month' ? 'الشهر' : 'الكل'}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${dateFilter === 'custom'
                            ? 'bg-[#556c33] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        📅 تحديد الفترة
                    </button>
                </div>

                {/* Custom Date Range Picker */}
                {showDatePicker && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-4 animate-fade-in">
                        <h4 className="text-gray-700 font-medium mb-3">📅 تحديد الفترة</h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">من تاريخ</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">إلى تاريخ</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCustomDateSelect}
                                disabled={!fromDate || !toDate}
                                className="flex-1 py-2 bg-[#556c33] text-white rounded-xl text-sm font-medium disabled:opacity-50"
                            >
                                تطبيق
                            </button>
                            <button
                                onClick={clearCustomDate}
                                className="py-2 px-4 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                )}

                {/* Show selected date range if custom */}
                {dateFilter === 'custom' && fromDate && toDate && (
                    <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-center justify-between">
                        <span className="text-blue-700 text-sm">
                            📅 من {fromDate} إلى {toDate}
                        </span>
                        <button
                            onClick={clearCustomDate}
                            className="text-blue-600 text-xs hover:underline"
                        >
                            إلغاء
                        </button>
                    </div>
                )}

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {/* Revenue */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-gray-500 text-xs">إجمالي الإيرادات</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                    </div>

                    {/* Purchases (New) */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">المصروفات (شراء)</p>
                        <p className="text-xl font-bold text-orange-600">-{formatCurrency(stats.totalPurchases)}</p>
                    </div>

                    {/* Waste Cost */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">تكلفة الهدر</p>
                        <p className="text-xl font-bold text-red-600">-{formatCurrency(stats.totalWaste)}</p>
                    </div>
                </div>

                {/* Profit Card (Full Width) */}
                <div className={`rounded-2xl p-5 shadow-lg text-white mb-6 ${stats.netProfit >= 0 ? 'bg-gradient-to-br from-[#556c33] to-[#3e4f24]' : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-white/80 text-sm font-medium">صافي الربح (الإيرادات - المصروفات - الهدر)</p>
                        <span className="bg-white/20 px-2 py-1 rounded-lg text-xs">
                            {((stats.netProfit / (stats.totalRevenue || 1)) * 100).toFixed(1)}% هامش
                        </span>
                    </div>
                    <p className="text-3xl font-bold tracking-tight">{formatCurrency(stats.netProfit)}</p>
                </div>

                {/* Payment Method Breakdown */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-4">
                    <h3 className="text-gray-700 font-semibold mb-3">💰 تفاصيل طرق الدفع</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Cash */}
                        <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">💵</span>
                                <span className="text-green-700 font-medium text-sm">كاش</span>
                            </div>
                            <p className="text-green-800 font-bold text-lg">{formatCurrency(stats.totalCash)}</p>
                            <p className="text-green-600 text-xs">{stats.cashCount} عملية</p>
                        </div>

                        {/* Card */}
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">💳</span>
                                <span className="text-blue-700 font-medium text-sm">بطاقة</span>
                            </div>
                            <p className="text-blue-800 font-bold text-lg">{formatCurrency(stats.totalCard)}</p>
                            <p className="text-blue-600 text-xs">{stats.cardCount} عملية</p>
                        </div>

                    </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">متوسط البيع</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.avgSale)}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">المنتجات المباعة</p>
                        <p className="text-xl font-bold text-gray-900">{stats.totalItems}</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-4 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`flex-1 min-w-[100px] py-2 rounded-xl font-medium transition-colors ${activeTab === 'sales'
                            ? 'bg-[#556c33] text-white'
                            : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        المبيعات
                    </button>
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`flex-1 min-w-[100px] py-2 rounded-xl font-medium transition-colors ${activeTab === 'expenses'
                            ? 'bg-[#556c33] text-white'
                            : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        المصروفات
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`flex-1 min-w-[100px] py-2 rounded-xl font-medium transition-colors relative ${activeTab === 'alerts'
                            ? 'bg-[#556c33] text-white'
                            : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        التنبيهات
                        {lowStockAlerts.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {lowStockAlerts.length}
                            </span>
                        )}
                    </button>
                </div>

                {activeTab === 'sales' && (
                    <>
                        {/* Sales List */}
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="w-8 h-8 border-2 border-[#556c33] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredSales.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <p className="text-gray-500">لا توجد مبيعات في هذه الفترة</p>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-6">
                                {filteredSales.map((sale) => (
                                    <div
                                        key={sale.id}
                                        className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm animate-fade-in"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-semibold text-gray-900">{formatCurrency(sale.total)}</p>
                                                <p className="text-gray-500 text-xs">{formatDate(sale.date)}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.paymentMethod === 'cash'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {sale.paymentMethod === 'cash' ? '💵 كاش' : '💳 بطاقة'}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {sale.items.map((item, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                                                    {item.productName} ×{item.quantity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'expenses' && (
                    <div className="space-y-3 pb-6">
                        {filteredPurchases.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl">🧾</span>
                                </div>
                                <p className="text-gray-500">لا توجد مصروفات في هذه الفترة</p>
                            </div>
                        ) : (
                            filteredPurchases.map(p => (
                                <div key={p.id} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-gray-800">{p.ingredientName}</h4>
                                        <p className="text-xs text-gray-500">{formatDate(p.date)}</p>
                                        <p className="text-xs text-gray-400">الكمية: {p.quantity}</p>
                                    </div>
                                    <p className="font-bold text-orange-600 text-lg">
                                        -{formatCurrency(p.cost)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="space-y-3 pb-6">
                        {lowStockAlerts.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-gray-500">جميع المكونات متوفرة بكميات جيدة!</p>
                            </div>
                        ) : (
                            lowStockAlerts.map((alert) => (
                                <div
                                    key={alert.ingredient.id}
                                    className="bg-white rounded-2xl p-4 border border-red-200 animate-fade-in"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{alert.ingredient.name}</h3>
                                            <p className="text-red-500 text-sm">
                                                متبقي {alert.currentStock} {alert.ingredient.unit} فقط
                                            </p>
                                        </div>
                                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                                            مخزون منخفض
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500"
                                            style={{ width: `${Math.min(100, alert.percentageRemaining)}%` }}
                                        />
                                    </div>
                                    <p className="text-gray-400 text-xs mt-1">
                                        الحد الأدنى: {alert.threshold} {alert.ingredient.unit}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportsPage;
