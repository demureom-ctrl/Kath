// ==========================================
// Customers Page
// ==========================================

import { useState, useEffect } from 'react';
import { Header } from '../components/Layout';
import db from '../database';
import { Customer } from '../types';
import { formatCurrency } from '../utils/calculations';

export function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        initialPoints: '0'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const data = await db.getCustomers();
            setCustomers(data);
        } catch (err: any) {
            setError(err.message || 'فشل تحميل العملاء');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Basic validation
            if (!formData.name || !formData.phoneNumber) {
                throw new Error('الاسم ورقم الهاتف مطلوبان');
            }

            await db.addCustomer({
                name: formData.name,
                phoneNumber: formData.phoneNumber,
                loyaltyPoints: Number(formData.initialPoints) || 0,
                totalSpent: 0
            });

            setShowAddModal(false);
            setFormData({ name: '', phoneNumber: '', initialPoints: '0' });
            loadCustomers();
        } catch (err: any) {
            setError(err.message || 'فشل إضافة العميل');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phoneNumber.includes(searchTerm)
    );

    return (
        <div className="flex flex-col min-h-screen pb-24 bg-gray-50">
            <Header title="العملاء" subtitle="إدارة برنامج الولاء" />

            <div className="p-4 space-y-4">
                {/* Actions Bar */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو الرقم..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#556c33] focus:ring-1 focus:ring-[#556c33] outline-none transition-all"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-3 bg-[#556c33] text-white rounded-xl font-bold shadow-md hover:bg-[#3e4f24] transition-colors"
                    >
                        + عميل جديد
                    </button>
                </div>

                {/* Customers List */}
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-[#556c33] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredCustomers.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                لا يوجد عملاء {searchTerm && 'مطابقين للبحث'}
                            </div>
                        ) : (
                            filteredCustomers.map(customer => (
                                <div key={customer.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-green-100 text-[#556c33] rounded-full flex items-center justify-center font-bold text-lg">
                                            {customer.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{customer.name}</h3>
                                            <p className="text-gray-500 text-sm">{customer.phoneNumber}</p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg text-sm font-bold border border-yellow-100 mb-1">
                                            {customer.loyaltyPoints} نقطة
                                        </div>
                                        <p className="text-xs text-gray-400">مجموع الشراء: {formatCurrency(customer.totalSpent)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Add Customer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
                        <h2 className="text-xl font-bold mb-4 text-[#556c33]">إضافة عميل جديد</h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAddCustomer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#556c33]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#556c33]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">نقاط أولية (اختياري)</label>
                                <input
                                    type="number"
                                    value={formData.initialPoints}
                                    onChange={e => setFormData({ ...formData, initialPoints: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#556c33]"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-[#556c33] text-white rounded-xl font-bold shadow-md hover:bg-[#3e4f24] disabled:opacity-50"
                                >
                                    {isSubmitting ? 'جاري الإضافة...' : 'حفظ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
