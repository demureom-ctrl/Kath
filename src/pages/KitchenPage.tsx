// ==========================================
// Kitchen Page - Kitchen Display System (KDS)
// ==========================================

import { useOrders } from '../context/OrdersContext';
import { Header } from '../components/Layout';

export function KitchenPage() {
    const { activeOrders, updateOrderStatus } = useOrders();

    // Filter relevant orders (pending or ready)
    // We might want to remove 'ready' orders after some time or have a "history" view.
    // For now, show all active orders.
    const kitchenOrders = activeOrders.filter(o => o.status !== undefined); // All active orders are relevant

    const pendingOrders = kitchenOrders.filter(o => o.status === 'pending');
    const readyOrders = kitchenOrders.filter(o => o.status === 'ready');

    return (
        <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
            <Header title="المطبخ" subtitle="عرض الطلبات الحالية" />

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Pending Orders Section */}
                <div className="md:col-span-2 lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span>🕒</span> قيد التحضير ({pendingOrders.length})
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {pendingOrders.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500">لا توجد طلبات جديدة</p>
                            </div>
                        )}

                        {pendingOrders.map(order => (
                            <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-lg font-bold">
                                                جديد
                                            </span>
                                            <h3 className="font-bold text-lg mt-1">
                                                {order.customerName || 'بدون اسم'}
                                            </h3>
                                            <p className="text-xs text-gray-400">
                                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-mono font-bold text-gray-700">#{order.id.slice(-4)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm border-b border-dashed border-gray-100 pb-1 last:border-0">
                                                <span className="text-gray-800 font-medium">
                                                    {item.quantity}× {item.product.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => updateOrderStatus(order.id, 'ready')}
                                    className="w-full py-3 bg-[#556c33] hover:bg-[#3e4f24] text-white rounded-xl font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                    <span>✅</span> جاهز
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ready Orders Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span>✅</span> جاهز للتقديم ({readyOrders.length})
                    </h2>

                    <div className="space-y-3">
                        {readyOrders.length === 0 && (
                            <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500 text-sm">لا توجد طلبات جاهزة</p>
                            </div>
                        )}

                        {readyOrders.map(order => (
                            <div key={order.id} className="bg-green-50 rounded-2xl p-4 border border-green-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-green-900">
                                        {order.customerName}
                                    </h3>
                                    <span className="text-xs text-green-700 font-mono">#{order.id.slice(-4)}</span>
                                </div>
                                <p className="text-xs text-green-600 mb-2">
                                    {new Date(order.createdAt).toLocaleTimeString()}
                                </p>
                                <div className="text-sm text-gray-600">
                                    {order.items.length} منتجات
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KitchenPage;
