// ==========================================
// Waste Context - Waste Tracking & Cost Analysis
// ==========================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useInventory } from './InventoryContext';
import { useProducts } from './ProductsContext';
import { useActivity } from './ActivityContext';

export type WasteType = 'product' | 'ingredient';

export interface WasteLog {
    id: string;
    type: WasteType;
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    reason: string;
    cost: number;
    date: Date;
    userId: string;
    userName: string;
}

interface WasteContextType {
    wasteLogs: WasteLog[];
    addWasteLog: (
        type: WasteType,
        itemId: string,
        quantity: number,
        reason: string
    ) => Promise<{ success: boolean; error?: string }>;
    getWasteStats: (period: 'today' | 'week' | 'month' | 'all') => { totalCost: number; count: number };
    clearWasteLogs: () => void;
}

const WasteContext = createContext<WasteContextType | null>(null);

const STORAGE_KEY = 'coffee_pos_waste_logs';

export function WasteProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { ingredients, updateStock } = useInventory();
    const { products } = useProducts();
    const { logActivity } = useActivity();

    const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);

    // Load logs from storage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setWasteLogs(parsed.map((log: WasteLog) => ({
                    ...log,
                    date: new Date(log.date),
                })));
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // Save logs to storage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wasteLogs));
    }, [wasteLogs]);

    const calculateCost = (type: WasteType, itemId: string, quantity: number): number => {
        if (type === 'ingredient') {
            const ingredient = ingredients.find(i => i.id === itemId);
            if (!ingredient) return 0;
            return (ingredient.costPerUnit || 0) * quantity;
        } else {
            const product = products.find(p => p.id === itemId);
            if (!product) return 0;

            // Calculate product cost based on recipe
            const productCost = product.recipe.reduce((total, item) => {
                const ing = ingredients.find(i => i.id === item.ingredientId);
                return total + ((ing?.costPerUnit || 0) * item.quantity);
            }, 0);

            return productCost * quantity;
        }
    };

    const addWasteLog = async (
        type: WasteType,
        itemId: string,
        quantity: number,
        reason: string
    ): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'يجب تسجيل الدخول أولاً' };

        let itemName = '';
        let unit = '';
        const cost = calculateCost(type, itemId, quantity);

        try {
            if (type === 'ingredient') {
                const ingredient = ingredients.find(i => i.id === itemId);
                if (!ingredient) return { success: false, error: 'المكون غير موجود' };
                itemName = ingredient.name;
                unit = ingredient.unit;

                // Deduct from inventory
                await updateStock(itemId, -quantity);
            } else {
                const product = products.find(p => p.id === itemId);
                if (!product) return { success: false, error: 'المنتج غير موجود' };
                itemName = product.name;
                unit = 'قطعة';

                // Deduct ingredients for this product
                for (const item of product.recipe) {
                    await updateStock(item.ingredientId, -(item.quantity * quantity));
                }
            }

            const newLog: WasteLog = {
                id: `waste_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type,
                itemId,
                itemName,
                quantity,
                unit,
                reason,
                cost,
                date: new Date(),
                userId: user.id,
                userName: user.name,
            };

            setWasteLogs(prev => [newLog, ...prev]);

            logActivity('inventory_updated', `تسجيل هدر: ${quantity} ${unit} من ${itemName}`, {
                wasteId: newLog.id,
                reason,
                cost
            });

            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'فشل تسجيل الهدر' };
        }
    };

    const getWasteStats = (period: 'today' | 'week' | 'month' | 'all') => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const filtered = wasteLogs.filter(log => {
            const logDate = new Date(log.date);
            if (period === 'today') {
                return logDate >= today;
            } else if (period === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return logDate >= weekAgo;
            } else if (period === 'month') {
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return logDate >= monthAgo;
            }
            return true;
        });

        const totalCost = filtered.reduce((sum, log) => sum + log.cost, 0);

        return { totalCost, count: filtered.length };
    };

    const clearWasteLogs = () => {
        setWasteLogs([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    const value: WasteContextType = {
        wasteLogs,
        addWasteLog,
        getWasteStats,
        clearWasteLogs,
    };

    return <WasteContext.Provider value={value}>{children}</WasteContext.Provider>;
}

export function useWaste() {
    const context = useContext(WasteContext);
    if (!context) {
        throw new Error('useWaste must be used within a WasteProvider');
    }
    return context;
}

export default WasteContext;
