// ==========================================
// Customer Order Page - Public ordering page for drive-thru
// ==========================================

import { useState, useEffect, useMemo } from 'react';
import { Product, CartItem } from '../types';
import database from '../database';
import { calculateCartTotal } from '../utils/calculations';

// Session duration in milliseconds (5 minutes)
const SESSION_DURATION = 5 * 60 * 1000;

interface CustomerOrderPageProps {
    token: string;
}

export function CustomerOrderPage({ token }: CustomerOrderPageProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sessionValid, setSessionValid] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [orderSubmitted, setOrderSubmitted] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [showNameModal, setShowNameModal] = useState(false);

    // Parse token and validate session
    useEffect(() => {
        if (!token) {
            setSessionValid(false);
            setLoading(false);
            return;
        }

        const parts = token.split('-');
        if (parts.length < 2) {
            setSessionValid(false);
            setLoading(false);
            return;
        }

        const timestamp = parseInt(parts[0], 10);
        if (isNaN(timestamp)) {
            setSessionValid(false);
            setLoading(false);
            return;
        }

        const expiresAt = timestamp + SESSION_DURATION;
        const remaining = expiresAt - Date.now();

        if (remaining <= 0) {
            setSessionValid(false);
            setLoading(false);
            return;
        }

        setSessionValid(true);
        setTimeLeft(remaining);

        // Start countdown
        const interval = setInterval(() => {
            const newRemaining = expiresAt - Date.now();
            if (newRemaining <= 0) {
                setTimeLeft(0);
                setSessionValid(false);
                clearInterval(interval);
            } else {
                setTimeLeft(newRemaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [token]);

    // Load products
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const fetchedProducts = await database.getProducts();
                setProducts(fetchedProducts.filter(p => p.isActive));
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                setLoading(false);
            }
        };

        if (sessionValid) {
            loadProducts();
        }
    }, [sessionValid]);

    // Format time remaining
    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Add to cart
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    // Update quantity
    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            return prev
                .map(item => {
                    if (item.product.id === productId) {
                        const newQty = item.quantity + delta;
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter((item): item is CartItem => item !== null);
        });
    };

    // Calculate total
    const cartTotal = useMemo(() => calculateCartTotal(cart), [cart]);

    // Submit order
    const submitOrder = async () => {
        if (cart.length === 0 || !customerName.trim()) return;

        try {
            // Create order via database API (Supabase for cross-device sync)
            await database.addOrder({
                customerName: customerName.trim(),
                items: cart,
                status: 'pending',
                total: cartTotal,
                createdAt: new Date(),
            });

            setOrderSubmitted(true);
            setCart([]);
        } catch (error) {
            console.error('Failed to submit order:', error);
            alert('حدث خطأ في إرسال الطلب');
        }
    };

    // Handle submit button click
    const handleSubmit = () => {
        if (cart.length === 0) return;
        setShowNameModal(true);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#556c33] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Session expired
    if (!sessionValid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-red-200 rounded-full flex items-center justify-center">
                        <span className="text-4xl">⏰</span>
                    </div>
                    <h1 className="text-2xl font-bold text-red-800 mb-2">
                        انتهت الجلسة
                    </h1>
                    <p className="text-red-600 mb-6">
                        يرجى مسح الباركود مرة أخرى للطلب
                    </p>
                </div>
            </div>
        );
    }

    // Order submitted
    if (orderSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-green-200 rounded-full flex items-center justify-center">
                        <span className="text-4xl">✅</span>
                    </div>
                    <h1 className="text-2xl font-bold text-green-800 mb-2">
                        تم إرسال طلبك!
                    </h1>
                    <p className="text-green-600 mb-6">
                        سيتم تحضير طلبك قريباً
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header with timer */}
            <div className="sticky top-0 z-40 bg-gradient-to-r from-[#556c33] to-[#3e4f24] text-white p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">☕ اطلب الآن</h1>
                        <p className="text-sm opacity-80">اختر منتجاتك</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-bold ${timeLeft < 60000 ? 'bg-red-500' : 'bg-white/20'
                        }`}>
                        ⏱️ {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
                {products.map(product => {
                    const inCart = cart.find(item => item.product.id === product.id);
                    return (
                        <div
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all cursor-pointer ${inCart ? 'border-[#556c33] bg-green-50' : 'border-transparent'
                                }`}
                        >
                            <div className="text-3xl mb-2">☕</div>
                            <h3 className="font-bold text-gray-800 text-sm mb-1">
                                {product.name}
                            </h3>
                            <p className="text-[#556c33] font-bold">
                                {product.price.toFixed(2)} ر.س
                            </p>
                            {inCart && (
                                <div className="mt-2 flex items-center justify-center gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, -1); }}
                                        className="w-8 h-8 bg-gray-200 rounded-full font-bold"
                                    >
                                        -
                                    </button>
                                    <span className="font-bold">{inCart.quantity}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, 1); }}
                                        className="w-8 h-8 bg-[#556c33] text-white rounded-full font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Cart Summary - Fixed at bottom */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600">
                            {cart.reduce((sum, item) => sum + item.quantity, 0)} منتجات
                        </span>
                        <span className="text-xl font-bold text-[#556c33]">
                            {cartTotal.toFixed(2)} ر.س
                        </span>
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="w-full py-4 bg-gradient-to-r from-[#556c33] to-[#3e4f24] text-white rounded-2xl font-bold text-lg"
                    >
                        إرسال الطلب
                    </button>
                </div>
            )}

            {/* Name Modal */}
            {showNameModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                            أدخل رقم السيارة أو الاسم
                        </h2>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="مثال: ABC 123"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-lg mb-4"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowNameModal(false)}
                                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={() => {
                                    if (customerName.trim()) {
                                        setShowNameModal(false);
                                        submitOrder();
                                    }
                                }}
                                disabled={!customerName.trim()}
                                className="flex-1 py-3 bg-[#556c33] text-white rounded-xl font-bold disabled:opacity-50"
                            >
                                تأكيد
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomerOrderPage;
