// ==========================================
// Sales Context - Transaction Management
// ==========================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Sale, SaleItem, CartItem, Product, Customer } from '../types';
import { database } from '../database';
import { calculateDeductions, canCompleteSale, calculateCartTotal } from '../utils/calculations';
import { useInventory } from './InventoryContext';
import { useProducts } from './ProductsContext';

interface SalesContextType {
    sales: Sale[];
    cart: CartItem[];
    cartTotal: number;
    loading: boolean;
    error: string | null;
    refreshSales: () => Promise<void>;
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    completeSale: (paymentMethod: 'cash' | 'card') => Promise<Sale | null>;
    getSaleById: (id: string) => Sale | undefined;
    getTodaySales: () => Sale[];
    getTodayRevenue: () => number;
    loadCart: (items: CartItem[]) => void;
    // Customer & Loyalty
    selectedCustomer: Customer | null;
    selectCustomer: (customer: Customer | null) => void;
    discountAmount: number;
    setDiscountAmount: (amount: number) => void;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children }: { children: ReactNode }) {
    const [sales, setSales] = useState<Sale[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Loyalty State
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [redeemAmount, setRedeemAmount] = useState(0); // Amount in SAR

    const { ingredients, deductInventory, refreshIngredients } = useInventory();
    const { products } = useProducts();

    const cartTotalRaw = calculateCartTotal(cart);
    const cartTotal = Math.max(0, cartTotalRaw - redeemAmount);

    // Reset redemption when cart or customer changes to avoid invalid states
    useEffect(() => {
        if (!selectedCustomer) {
            setRedeemAmount(0);
        } else {
            // Ensure we don't redeem more than total or available points
            // 150 points = 1 SAR discount
            const maxPointsValue = Math.floor(selectedCustomer.loyaltyPoints / 150);
            const maxCartValue = Math.floor(cartTotalRaw); // Cannot redeem more than the cart total
            const maxRedeem = Math.min(maxPointsValue, maxCartValue);

            if (redeemAmount > maxRedeem) {
                setRedeemAmount(maxRedeem);
            }
        }
    }, [cartTotalRaw, selectedCustomer, redeemAmount]);

    const refreshSales = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await database.getSales();
            setSales(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load sales');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSales();
    }, [refreshSales]);

    const addToCart = useCallback((product: Product, quantity = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { product, quantity }];
        });
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    }, []);

    const updateCartQuantity = useCallback((productId: string, quantity: number) => {
        if (quantity <= 0) {
            setCart(prev => prev.filter(item => item.product.id !== productId));
        } else {
            setCart(prev => prev.map(item =>
                item.product.id === productId ? { ...item, quantity } : item
            ));
        }
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
        setSelectedCustomer(null);
        setRedeemAmount(0);
    }, []);

    const loadCart = useCallback((items: CartItem[]) => {
        setCart(items);
    }, []);

    const selectCustomer = useCallback((customer: Customer | null) => {
        setSelectedCustomer(customer);
        setRedeemAmount(0);
    }, []);

    const completeSale = useCallback(async (paymentMethod: 'cash' | 'card'): Promise<Sale | null> => {
        if (cart.length === 0) {
            setError('Cart is empty');
            return null;
        }

        // Check if we have enough inventory
        const { canComplete, missingItems } = canCompleteSale(cart, ingredients);
        if (!canComplete) {
            const missingDesc = missingItems
                .map(m => `${m.ingredientName}: need ${m.needed}, have ${m.available}`)
                .join(', ');
            setError(`Insufficient inventory: ${missingDesc}`);
            return null;
        }

        try {
            // Calculate deductions
            const deductions = calculateDeductions(cart, products);

            // Create sale items
            const saleItems: SaleItem[] = cart.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                unitPrice: item.product.price,
                subtotal: item.product.price * item.quantity,
            }));

            // Create sale record
            // We need to extend Sale type to support customer info if we want to save it there directly,
            // or just rely on the customer update.
            // For now, let's just update the customer.

            const sale: Omit<Sale, 'id'> = {
                date: new Date(),
                items: saleItems,
                total: cartTotal, // This is explicitly the discounted total
                paymentMethod,
                customerId: selectedCustomer?.id,
                discountAmount: redeemAmount,
                pointsRedeemed: redeemAmount * 150
            };

            // Deduct inventory first
            await deductInventory(deductions);

            // Add sale to database
            const newSale = await database.addSale(sale);

            // --- Loyalty Logic ---
            if (selectedCustomer) {
                try {
                    let pointsChange = 0;

                    // 1. Redeem Points (1 SAR = 150 Points)
                    if (redeemAmount > 0) {
                        pointsChange -= (redeemAmount * 150);
                    }

                    // 2. Earn Points: 1 SAR = 10 Points
                    // Earn ONLY on the amount paid (cartTotal)
                    const earnedPoints = Math.floor(cartTotal * 10);
                    pointsChange += earnedPoints;

                    // Update Customer
                    await database.updateCustomer(selectedCustomer.id, {
                        loyaltyPoints: Math.max(0, selectedCustomer.loyaltyPoints + pointsChange),
                        totalSpent: selectedCustomer.totalSpent + cartTotal,
                        lastTransactionDate: new Date()
                    });
                } catch (loyaltyError) {
                    console.error("Failed to update loyalty points:", loyaltyError);
                    // We don't throw here to ensure the sale is still marked as completed in the UI
                    // You might want to show a toast warning here in a production app
                }
            }
            // ---------------------

            setSales(prev => [newSale, ...prev]);

            // Clear cart
            clearCart();
            setError(null);

            return newSale;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to complete sale');
            // Refresh inventory to restore correct state
            await refreshIngredients();
            return null;
        }
    }, [cart, cartTotal, ingredients, products, deductInventory, clearCart, refreshIngredients, selectedCustomer, redeemAmount]);

    const getSaleById = useCallback((id: string) => {
        return sales.find(sale => sale.id === id);
    }, [sales]);

    const getTodaySales = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return sales.filter(sale => new Date(sale.date) >= today);
    }, [sales]);

    const getTodayRevenue = useCallback(() => {
        return getTodaySales().reduce((sum, sale) => sum + sale.total, 0);
    }, [getTodaySales]);

    return (
        <SalesContext.Provider value={{
            sales,
            cart,
            cartTotal,
            loading,
            error,
            refreshSales,
            addToCart,
            removeFromCart,
            updateCartQuantity,
            clearCart,
            completeSale,
            getSaleById,
            getTodaySales,
            getTodayRevenue,
            loadCart,
            selectedCustomer,
            selectCustomer,
            discountAmount: redeemAmount, // Expose as discountAmount to match interface (renamed from redeemPoints)
            setDiscountAmount: setRedeemAmount, // Expose setter
        }}>
            {children}
        </SalesContext.Provider>
    );
}

export function useSales() {
    const context = useContext(SalesContext);
    if (!context) {
        throw new Error('useSales must be used within a SalesProvider');
    }
    return context;
}
