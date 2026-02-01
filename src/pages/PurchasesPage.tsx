// ==========================================
// Purchases Page - POS Style Interface
// ==========================================

import { useState } from 'react';
import { Header } from '../components/Layout';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency } from '../utils/calculations';
import { Ingredient } from '../types';

interface CartItem {
    ingredient: Ingredient;
    quantity: number;
    totalCost: number;
}

export function PurchasesPage() {
    const { ingredients, addPurchase, loading } = useInventory();

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter Ingredients
    const filteredIngredients = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Cart Total
    const cartTotal = cart.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    const cartCount = cart.length;

    const handleAddToCart = (ingredient: Ingredient) => {
        // Check if already in cart
        if (cart.some(item => item.ingredient.id === ingredient.id)) {
            // Already in cart - maybe show toast or open cart
            setShowCart(true);
            return;
        }

        // Add to cart with default values
        setCart([...cart, {
            ingredient,
            quantity: 0, // Force user to enter
            totalCost: 0 // Force user to enter
        }]);
        setShowCart(true);
    };

    const removeFromCart = (ingredientId: string) => {
        setCart(cart.filter(item => item.ingredient.id !== ingredientId));
    };

    const updateCartItem = (ingredientId: string, field: 'quantity' | 'totalCost', value: number) => {
        setCart(cart.map(item => {
            if (item.ingredient.id === ingredientId) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleEmptyCart = () => {
        if (window.confirm('هل أنت متأكد من مسح القائمة؟')) {
            setCart([]);
            setShowCart(false);
        }
    };

    const handleCompletePurchase = async () => {
        // Validate inputs
        const invalidItems = cart.filter(item => item.quantity <= 0 || item.totalCost <= 0);
        if (invalidItems.length > 0) {
            alert('يرجى تحديد الكمية والسعر لجميع المواد في السلة');
            return;
        }

        if (!window.confirm(`تأكيد تسجيل المشتريات بقيمة ${formatCurrency(cartTotal)}؟`)) return;

        try {
            setProcessing(true);
            const today = new Date();

            // Process all items sequentially
            for (const item of cart) {
                await addPurchase({
                    ingredientId: item.ingredient.id,
                    ingredientName: item.ingredient.name,
                    quantity: item.quantity,
                    cost: item.totalCost,
                    date: today,
                });
            }

            setSuccessMessage(`تم تسجيل المشتريات بنجاح! ${formatCurrency(cartTotal)}`);
            setCart([]);
            setShowCart(false);

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Purchase failed', error);
            alert('حدث خطأ أثناء تسجيل العملية');
        } finally {
            setProcessing(false);
        }
    };

    // Helper to get generic icon based on name
    const getIcon = (name: string) => {
        if (name.includes('بن') || name.includes('coffee')) return '☕';
        if (name.includes('حليب') || name.includes('milk')) return '🥛';
        if (name.includes('سكر') || name.includes('sugar')) return '🍬';
        if (name.includes('كوب') || name.includes('cup')) return '🥤';
        return '📦';
    };

    return (
        <div className="flex flex-col h-screen pb-20 relative bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-2">
                <Header title="المشتريات" subtitle="نقطة شراء المواد الخام" />

                {/* Search Bar */}
                <div className="mt-2 relative">
                    <input
                        type="text"
                        placeholder="بحث عن مادة..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#556c33] transition-all"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Success Toast */}
            {successMessage && (
                <div className="fixed top-24 left-4 right-4 z-[60] animate-slide-up">
                    <div className="bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {successMessage}
                    </div>
                </div>
            )}

            {/* Grid Content */}
            <div className="flex-1 p-4 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 border-2 border-[#556c33] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 pb-20">
                        {filteredIngredients.map((ing, index) => {
                            const isInCart = cart.some(item => item.ingredient.id === ing.id);

                            return (
                                <button
                                    key={ing.id}
                                    onClick={() => handleAddToCart(ing)}
                                    className={`
                                        relative p-4 rounded-2xl text-left transition-all duration-300
                                        flex flex-col items-center justify-center text-center gap-2
                                        border border-gray-200
                                        ${isInCart
                                            ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500'
                                            : 'bg-white hover:bg-gray-50 hover:shadow-md'
                                        }
                                    `}
                                >
                                    <div className="text-4xl filter drop-shadow-sm mb-1">{getIcon(ing.name)}</div>

                                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem] flex items-center">
                                        {ing.name}
                                    </h3>

                                    <div className="mt-1 flex gap-2 text-xs">
                                        <span className="px-2 py-1 bg-gray-100 rounded-lg text-gray-600">
                                            المخزون: {ing.currentStock} {ing.unit}
                                        </span>
                                    </div>

                                    {isInCart && (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                                            ✓
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cart Floating Button (Like POS) */}
            {cartCount > 0 && (
                <div className="fixed bottom-20 left-4 right-4 z-40">
                    <div
                        onClick={() => setShowCart(true)}
                        className="bg-gray-900 text-white rounded-2xl p-4 shadow-xl cursor-pointer flex justify-between items-center"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                                {cartCount}
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">سلة المشتريات</p>
                                <p className="font-bold text-lg">{formatCurrency(cartTotal)}</p>
                            </div>
                        </div>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Cart Modal / Sheet */}
            {showCart && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)} />

                    <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up flex flex-col max-h-[85vh]">
                        {/* Drag Handle */}
                        <div className="flex justify-center py-3 border-b border-gray-100" onClick={() => setShowCart(false)}>
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                        </div>

                        {/* Cart Header */}
                        <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">فاتورة الشراء</h2>
                            <button onClick={handleEmptyCart} className="text-red-500 text-sm hover:underline">
                                مسح الكل
                            </button>
                        </div>

                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                            {cart.length === 0 ? (
                                <p className="text-center text-gray-500 py-10">السلة فارغة</p>
                            ) : (
                                cart.map((item, index) => (
                                    <div key={item.ingredient.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                                                    {getIcon(item.ingredient.name)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{item.ingredient.name}</h3>
                                                    <p className="text-xs text-gray-500">الوحدة: {item.ingredient.unit}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.ingredient.id)}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Quantity Input */}
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">الكمية ({item.ingredient.unit})</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity || ''}
                                                    onChange={(e) => updateCartItem(item.ingredient.id, 'quantity', parseFloat(e.target.value))}
                                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-[#556c33] focus:outline-none"
                                                    placeholder="0"
                                                />
                                            </div>

                                            {/* Cost Input */}
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">السعر الإجمالي</label>
                                                <input
                                                    type="number"
                                                    value={item.totalCost || ''}
                                                    onChange={(e) => updateCartItem(item.ingredient.id, 'totalCost', parseFloat(e.target.value))}
                                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-[#556c33] focus:outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Totals & Action */}
                        <div className="p-4 bg-white border-t border-gray-200 safe-area-bottom">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">إجمالي الفاتورة</span>
                                <span className="text-2xl font-bold text-[#556c33]">{formatCurrency(cartTotal)}</span>
                            </div>

                            <button
                                onClick={handleCompletePurchase}
                                disabled={processing || cart.length === 0}
                                className="w-full py-4 bg-[#556c33] hover:bg-[#3e4f24] text-white rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all"
                            >
                                {processing ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>💾</span>
                                        تسجيل المشتريات
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Fallback if icon helper is needed
function getProductIcon(name: string) {
    return '📦';
}
