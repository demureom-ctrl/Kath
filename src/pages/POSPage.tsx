// ==========================================
// POS Page - Point of Sale Interface - Light Theme
// ==========================================

import { useState, useEffect } from 'react';
import { Header } from '../components/Layout';
import { useProducts } from '../context/ProductsContext';
import { useSales } from '../context/SalesContext';
import { useActivity } from '../context/ActivityContext';
import { useOrders } from '../context/OrdersContext';

import { getProductIcon } from '../utils/productIcons';

import { formatCurrency, calculateCartTotal } from '../utils/calculations';
import { Product, Customer } from '../types';
import database from '../database';

const CustomerSelection = () => {
    const { selectedCustomer, selectCustomer, discountAmount, setDiscountAmount, cart } = useSales();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [searching, setSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    const cartTotalRaw = calculateCartTotal(cart);

    // Calculate max redeemable SAR based on 150 pts = 1 SAR rule
    // And limited by the cart total (cannot discount more than total)
    const maxPointsValue = selectedCustomer ? Math.floor(selectedCustomer.loyaltyPoints / 150) : 0;
    const maxCartValue = Math.floor(cartTotalRaw);
    const maxRedeem = Math.min(maxPointsValue, maxCartValue);

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 3) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            // Fetch all customers and filter locally to allow partial matches for both name and phone
            const all = await database.getCustomers();
            const filtered = all.filter(c =>
                c.name.toLowerCase().includes(term.toLowerCase()) ||
                c.phoneNumber.includes(term)
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    if (selectedCustomer) {
        return (
            <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl mb-3 border border-green-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">👤</span>
                            <h3 className="font-bold text-gray-800 text-lg">{selectedCustomer.name}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{selectedCustomer.phoneNumber}</span>
                            <span className="text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded text-xs">
                                {selectedCustomer.loyaltyPoints} نقطة
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => selectCustomer(null)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                        ✕
                    </button>
                </div>

                {/* Redemption Section */}
                <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-700">استخدام النقاط</span>
                        <span className="text-xs text-[#556c33] font-medium bg-[#556c33]/10 px-2 py-1 rounded">
                            رصيد: {Math.floor(selectedCustomer.loyaltyPoints / 150)} ريال
                        </span>
                    </div>

                    {maxRedeem > 0 ? (
                        <div className="space-y-3">
                            <input
                                type="range"
                                min="0"
                                max={maxRedeem}
                                step="1"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#556c33]"
                            />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">خصم: <b className="text-[#556c33] text-base">{discountAmount} ريال</b></span>
                                <span className="text-gray-400 text-xs">(-{discountAmount * 150} نقطة)</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-center text-gray-400 py-1">
                            {selectedCustomer.loyaltyPoints < 150
                                ? 'الرصيد غير كافي (الحد الأدنى 150 نقطة)'
                                : 'لا يمكن استخدام النقاط (السلة فارغة أو المبلغ بسيط)'}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-3 relative group">
            {!showSearch ? (
                <button
                    onClick={() => setShowSearch(true)}
                    className="w-full py-3 bg-white border-2 border-dashed border-gray-300 text-gray-500 rounded-xl text-sm font-medium hover:border-[#556c33] hover:text-[#556c33] hover:bg-green-50/50 transition-all flex items-center justify-center gap-2"
                >
                    <span className="text-xl">🔍</span>
                    بحث عن عميل / تسجيل نقاط
                </button>
            ) : (
                <div className="relative animate-fade-in">
                    <div className="relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="اسم العميل أو رقم الجوال..."
                            className="w-full pl-10 pr-10 py-3 bg-white border-2 border-[#556c33] rounded-xl text-sm focus:outline-none shadow-sm font-medium"
                            autoFocus
                        />
                        <button
                            onClick={() => { setShowSearch(false); setSearchTerm(''); setSearchResults([]); }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Search Results Dropdown */}
                    {(searchResults.length > 0 || searching) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50 divide-y divide-gray-50">
                            {searching ? (
                                <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-[#556c33] border-t-transparent rounded-full animate-spin"></div>
                                    جاري البحث...
                                </div>
                            ) : (
                                searchResults.map(customer => (
                                    <button
                                        key={customer.id}
                                        onClick={() => { selectCustomer(customer); setShowSearch(false); setSearchTerm(''); }}
                                        className="w-full text-right p-3 hover:bg-green-50 transition-colors flex justify-between items-center group/item"
                                    >
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm group-hover/item:text-[#556c33] transition-colors">{customer.name}</p>
                                            <p className="text-xs text-gray-400 font-mono mt-0.5">{customer.phoneNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-xs font-bold text-[#556c33] bg-[#556c33]/10 px-2 py-1 rounded-lg">
                                                {customer.loyaltyPoints} pts
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export function POSPage() {
    const { productsWithYield, loading: productsLoading } = useProducts();
    const { cart, cartTotal, addToCart, updateCartQuantity, clearCart, completeSale, loadCart, selectCustomer, selectedCustomer, error } = useSales();
    const { logActivity } = useActivity();
    const { activeOrders, createOrder, updateOrder, deleteOrder } = useOrders();
    const { categories } = useProducts(); // Get categories

    const [processing, setProcessing] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [confirmPayment, setConfirmPayment] = useState<'cash' | 'card' | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All'); // Category Filter State

    // Track previous ready orders to detect new ones
    const [prevReadyCount, setPrevReadyCount] = useState(0);

    // Multi-order state
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
    const [showCarInput, setShowCarInput] = useState(false);
    const [showActiveOrders, setShowActiveOrders] = useState(false);
    const [carNumber, setCarNumber] = useState('');

    // Notification Logic - Wrapped in useEffect to avoid render loops
    useEffect(() => {
        const readyOrders = activeOrders.filter(o => o.status === 'ready');
        if (readyOrders.length > prevReadyCount) {
            // Find the new one (latest ready)
            const newReady = readyOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            if (newReady) {
                setNotification(`الطلب جاهز! #${newReady.customerName}`);
                // Play sound here if we had an audio file
                setTimeout(() => setNotification(null), 5000);
            }
            setPrevReadyCount(readyOrders.length);
        } else if (readyOrders.length < prevReadyCount) {
            // Reset count if orders are picked up/completed without notifying
            setPrevReadyCount(readyOrders.length);
        }
    }, [activeOrders, prevReadyCount]);

    const handleAddToCart = (product: Product) => {
        addToCart(product);
        setShowCart(true);
    };

    const handlePaymentClick = (paymentMethod: 'cash' | 'card') => {
        setConfirmPayment(paymentMethod);
    };

    const handleConfirmSale = async () => {
        if (!confirmPayment) return;

        setProcessing(true);
        const sale = await completeSale(confirmPayment);
        setProcessing(false);

        if (sale) {
            // Log the sale activity
            const itemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
            const itemsList = sale.items.map(i => `${i.productName} ×${i.quantity}`).join(', ');
            logActivity('sale_completed', `عملية بيع: ${formatCurrency(sale.total)} (${confirmPayment === 'cash' ? 'كاش' : 'بطاقة'})`, {
                saleId: sale.id,
                total: sale.total,
                paymentMethod: confirmPayment,
                itemsCount,
                items: itemsList,
            });

            // If this was a parked order, remove it from active orders
            if (currentOrderId) {
                deleteOrder(currentOrderId);
                setCurrentOrderId(null);
            }

            setSuccessMessage(`تمت العملية بنجاح! ${formatCurrency(sale.total)}`);
            setTimeout(() => setSuccessMessage(null), 3000);
            setShowCart(false);
            setConfirmPayment(null);
        }
    };

    const handleCancelConfirm = () => {
        setConfirmPayment(null);
    };

    // --- Order Management Handlers ---

    const handleParkOrder = () => {
        if (!carNumber.trim()) return;
        createOrder(carNumber, cart, selectedCustomer?.id);
        clearCart();
        setCarNumber('');
        setShowCarInput(false);
        setSuccessMessage('تم حفظ الطلب بنجاح 👍'); // Order saved
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleUpdateOrder = () => {
        if (currentOrderId) {
            updateOrder(currentOrderId, cart);
            setSuccessMessage('تم تحديث الطلب 👌'); // Order updated
            setTimeout(() => setSuccessMessage(null), 2000);
        }
    };

    const handleResumeOrder = async (orderId: string) => {
        const order = activeOrders.find(o => o.id === orderId);
        if (order) {
            loadCart(order.items);
            setCurrentOrderId(order.id);

            // Link Customer if exists
            if (order.customerId) {
                try {
                    const customer = await database.getCustomers().then(customers => customers.find(c => c.id === order.customerId));
                    // Optimization: Use getCustomerById if available, but currently we only have getCustomers or getCustomerByPhone in interface.
                    // Actually, we don't have getCustomerById in IDatabase interface yet. 
                    // Let's use getCustomers() and find.
                    if (customer) {
                        selectCustomer(customer);
                    }
                } catch (err) {
                    console.error("Failed to load customer for order", err);
                }
            } else {
                selectCustomer(null);
            }

            setShowActiveOrders(false);
            setShowCart(true);
        }
    };

    const handleDeleteOrder = (orderId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering handleResumeOrder
        if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.')) {
            deleteOrder(orderId);
            if (currentOrderId === orderId) {
                handleNewOrder();
            }
            setSuccessMessage('تم حذف الطلب 🗑️');
            setTimeout(() => setSuccessMessage(null), 2000);
        }
    };

    const handleNewOrder = () => {
        clearCart();
        setCurrentOrderId(null);
        setShowCart(false);
    };

    // Ready notifications (orders marked ready by kitchen)
    const readyOrdersCount = activeOrders.filter(o => o.status === 'ready').length;

    // Filter products based on category
    const activeProducts = productsWithYield
        .filter(p => p.isActive)
        .filter(p => selectedCategory === 'All' || p.category === selectedCategory);

    return (
        <div className="flex flex-col min-h-screen pb-20 relative">
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
                <Header title="نقطة البيع" subtitle={currentOrderId ? `تعديل الطلب #${currentOrderId.slice(-4)}` : "طلب جديد"} />

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowActiveOrders(true)}
                        className="relative p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        <span className="text-xl">📋</span>
                        {activeOrders.length > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-[#556c33] text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                                {activeOrders.length}
                            </span>
                        )}
                        {readyOrdersCount > 0 && (
                            <span className="absolute -top-1 -left-1 min-w-[1.25rem] h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-bounce">
                                ✅
                            </span>
                        )}
                    </button>
                    {cart.length > 0 && !currentOrderId && (
                        <button
                            onClick={() => setShowCarInput(true)}
                            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl font-bold text-sm hover:bg-yellow-200"
                        >
                            💾 حفظ
                        </button>
                    )}
                    {currentOrderId && (
                        <button
                            onClick={handleNewOrder}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100"
                        >
                            ➕ جديد
                        </button>
                    )}
                </div>
            </div>

            {/* Category tabs */}
            <div className="flex overflow-x-auto px-4 py-2 gap-2 no-scrollbar bg-gray-50 border-b border-gray-100">
                <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === 'All'
                        ? 'bg-[#556c33] text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    الكل
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat
                            ? 'bg-[#556c33] text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Success Message Toast */}
            {successMessage && (
                <div className="fixed top-20 left-4 right-4 z-50 animate-slide-up">
                    <div className="bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {successMessage}
                    </div>
                </div>
            )}

            {/* Ready Notification Toast */}
            {notification && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[80] animate-bounce-in">
                    <div className="bg-white border-2 border-green-500 text-green-800 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl animate-pulse">
                            🔔
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">تنبيه المطبخ</h3>
                            <p className="font-medium">{notification}</p>
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="mr-auto w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Products Grid */}
            <div className="flex-1 px-4 overflow-y-auto">
                {productsLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 border-2 border-[#556c33] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {activeProducts.map((product, index) => {
                            const isOutOfStock = product.maxYield === 0;
                            const isLowStock = product.maxYield > 0 && product.maxYield <= 5;
                            const productIcon = getProductIcon(product.name);

                            return (
                                <button
                                    key={product.id}
                                    onClick={() => !isOutOfStock && handleAddToCart(product)}
                                    disabled={isOutOfStock}
                                    className={`
                    relative p-4 rounded-2xl text-left transition-all duration-300
                    animate-fade-in
                    ${isOutOfStock
                                            ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                                            : 'bg-white hover:bg-gray-50 active:scale-95 shadow-md hover:shadow-lg'
                                        }
                    border border-gray-200 hover:border-[#556c33]/30
                  `}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Product Image Placeholder - NOW WITH SMART ICON */}
                                    <div className="flex items-center justify-center mb-3">
                                        <span className="text-4xl filter drop-shadow-sm">{productIcon}</span>
                                    </div>

                                    {/* Product Info */}
                                    <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">
                                        {product.name}
                                    </h3>

                                    <p className="text-[#556c33] font-bold">
                                        {formatCurrency(product.price)}
                                    </p>

                                    {/* Yield Badge */}
                                    <div className={`
                    absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium
                    ${isOutOfStock
                                            ? 'bg-red-100 text-red-600'
                                            : isLowStock
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-green-100 text-green-700'
                                        }
                  `}>
                                        {isOutOfStock ? 'نفذ' : `${product.maxYield} متبقي`}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cart Summary Bar */}
            {cart.length > 0 && (
                <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-4">
                    <div
                        onClick={() => setShowCart(true)}
                        className="bg-gradient-to-r from-[#556c33] to-[#3e4f24] rounded-2xl p-4 shadow-xl cursor-pointer active:scale-98 transition-transform"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                                </div>
                                <div>
                                    <p className="text-white/70 text-xs">عرض السلة</p>
                                    <p className="text-white font-bold">{formatCurrency(cartTotal)}</p>
                                </div>
                            </div>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Modal */}
            {showCart && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowCart(false)}
                    />

                    {/* Cart Panel */}
                    <div className="relative w-full max-w-lg bg-white rounded-t-3xl animate-slide-up max-h-[70vh] overflow-hidden shadow-2xl mb-16">
                        {/* Handle */}
                        <div className="flex justify-center py-3">
                            <div className="w-12 h-1 bg-gray-300 rounded-full" />
                        </div>

                        <div className="px-6 pb-8 overflow-y-auto max-h-[calc(70vh-50px)]">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">طلبك</h2>
                                <button
                                    onClick={clearCart}
                                    className="text-red-500 text-sm hover:text-red-600"
                                >
                                    مسح الكل
                                </button>
                            </div>

                            {/* Customer Selection */}
                            <CustomerSelection />

                            {/* Cart Items */}
                            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                                {cart.map((item) => (
                                    <div
                                        key={item.product.id}
                                        className="flex items-center justify-between bg-gray-50 rounded-xl p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#556c33] to-[#3e4f24] flex items-center justify-center">
                                                <span className="text-lg">☕</span>
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-medium text-sm">{item.product.name}</p>
                                                <p className="text-gray-500 text-xs">{formatCurrency(item.product.price)} للواحد</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                                className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                            >
                                                −
                                            </button>
                                            <span className="text-gray-900 font-medium w-6 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                                className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            <div className="flex items-center justify-between py-4 border-t border-gray-200">
                                <span className="text-gray-500">الإجمالي</span>
                                <span className="text-2xl font-bold text-gray-900">{formatCurrency(cartTotal)}</span>
                            </div>

                            {/* Payment Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                {currentOrderId ? (
                                    <button
                                        onClick={handleUpdateOrder}
                                        className="col-span-2 py-4 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>💾</span>
                                        حفظ التعديلات
                                    </button>
                                ) : null}

                                <button
                                    onClick={() => handlePaymentClick('cash')}
                                    disabled={processing}
                                    className="py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <span>💵</span>
                                    كاش
                                </button>
                                <button
                                    onClick={() => handlePaymentClick('card')}
                                    disabled={processing}
                                    className="py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <span>💳</span>
                                    بطاقة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmPayment && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancelConfirm} />
                    <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up shadow-2xl">
                        {/* Icon */}
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">تأكيد عملية البيع</h3>

                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-500">عدد المنتجات:</span>
                                <span className="font-medium text-gray-900">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-500">طريقة الدفع:</span>
                                <span className="font-medium text-gray-900">
                                    {confirmPayment === 'cash' ? '💵 كاش' : '💳 بطاقة'}
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="text-gray-700 font-medium">الإجمالي:</span>
                                <span className="font-bold text-lg text-[#556c33]">{formatCurrency(cartTotal)}</span>
                            </div>
                        </div>

                        <p className="text-gray-500 text-sm text-center mb-4">
                            هل أنت متأكد من تسجيل هذه العملية؟
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelConfirm}
                                disabled={processing}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleConfirmSale}
                                disabled={processing}
                                className={`flex-1 py-3 rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2 ${confirmPayment === 'cash'
                                    ? 'bg-green-600 hover:bg-green-500'
                                    : 'bg-blue-600 hover:bg-blue-500'
                                    }`}
                            >
                                {processing ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        تأكيد
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Active Orders Drawer/Sidebar */}
            {showActiveOrders && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowActiveOrders(false)} />
                    <div className="relative w-full max-w-sm bg-white h-full shadow-2xl animate-slide-left overflow-y-auto">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-gray-800 text-lg">الطلبات النشطة 📋</h2>
                            <button onClick={() => setShowActiveOrders(false)} className="p-2 hover:bg-gray-200 rounded-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            {activeOrders.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">لا توجد طلبات معلقة</p>
                            ) : (
                                activeOrders.map(order => (
                                    <div
                                        key={order.id}
                                        onClick={() => handleResumeOrder(order.id)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative group ${order.status === 'ready'
                                            ? 'bg-green-50 border-green-200 hover:border-green-300'
                                            : 'bg-white border-gray-100 hover:border-[#556c33]'
                                            }`}
                                    >
                                        <button
                                            onClick={(e) => handleDeleteOrder(order.id, e)}
                                            className="absolute top-2 left-2 p-2 bg-red-50 text-red-500 rounded-lg transition-opacity hover:bg-red-100 hover:text-red-700 z-10"
                                            title="حذف الطلب"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>

                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-800 text-lg">{order.customerName}</h3>
                                            <span className={`text-xs px-2 py-1 rounded-lg font-bold ${order.status === 'ready' ? 'bg-green-200 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {order.status === 'ready' ? 'جاهز ✅' : 'تحضير 🕒'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mb-2">
                                            {order.items.length} منتجات • {formatCurrency(order.total)}
                                        </div>
                                        <div className="text-[10px] text-gray-400">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • #{order.id.slice(-4)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Car Number Input Modal */}
            {showCarInput && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCarInput(false)} />
                    <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">رقم السيارة / اسم العميل</h3>
                        <input
                            type="text"
                            value={carNumber}
                            onChange={(e) => setCarNumber(e.target.value)}
                            placeholder="مثال: 40552 or محمد"
                            className="w-full text-center text-xl p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#556c33] mb-4 font-bold"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCarInput(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleParkOrder}
                                disabled={!carNumber.trim()}
                                className="flex-1 py-3 bg-[#556c33] text-white rounded-xl font-bold disabled:opacity-50 shadow-md"
                            >
                                حفظ الطلب
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


