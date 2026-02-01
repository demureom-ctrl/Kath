// ==========================================
// Inventory Context - Raw Materials Management
// ==========================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Ingredient, LowStockAlert, InventoryDeduction, Purchase } from '../types';
import { database } from '../database';
import { getLowStockAlerts } from '../utils/calculations';

interface InventoryContextType {
    ingredients: Ingredient[];
    lowStockAlerts: LowStockAlert[];
    purchases: Purchase[]; // Added
    loading: boolean;
    error: string | null;
    refreshIngredients: () => Promise<void>;
    addIngredient: (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Ingredient>;
    updateIngredient: (id: string, data: Partial<Omit<Ingredient, 'id' | 'createdAt'>>) => Promise<void>;
    deleteIngredient: (id: string) => Promise<void>;
    deductInventory: (deductions: InventoryDeduction[]) => Promise<void>;
    restockIngredient: (id: string, amount: number) => Promise<void>;
    updateStock: (id: string, change: number) => Promise<void>;
    getIngredientById: (id: string) => Ingredient | undefined;
    addPurchase: (purchase: Omit<Purchase, 'id'>) => Promise<void>; // Added
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]); // Added
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const lowStockAlerts = getLowStockAlerts(ingredients);

    const refreshIngredients = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [ingData, purchData] = await Promise.all([
                database.getIngredients(),
                database.getPurchases()
            ]);
            setIngredients(ingData);
            setPurchases(purchData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load ingredients');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshIngredients();
    }, [refreshIngredients]);

    const addIngredient = useCallback(async (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newIngredient = await database.addIngredient(ingredient);
        setIngredients(prev => [...prev, newIngredient]);
        return newIngredient;
    }, []);

    const updateIngredient = useCallback(async (id: string, data: Partial<Omit<Ingredient, 'id' | 'createdAt'>>) => {
        await database.updateIngredient(id, data);
        setIngredients(prev => prev.map(ing =>
            ing.id === id ? { ...ing, ...data, updatedAt: new Date() } : ing
        ));
    }, []);

    const deleteIngredient = useCallback(async (id: string) => {
        await database.deleteIngredient(id);
        setIngredients(prev => prev.filter(ing => ing.id !== id));
    }, []);

    const deductInventory = useCallback(async (deductions: InventoryDeduction[]) => {
        await database.deductInventory(deductions);
        // Update local state
        setIngredients(prev => prev.map(ing => {
            const deduction = deductions.find(d => d.ingredientId === ing.id);
            if (deduction) {
                return {
                    ...ing,
                    currentStock: Math.max(0, ing.currentStock - deduction.amount),
                    updatedAt: new Date(),
                };
            }
            return ing;
        }));
    }, []);

    // Also used for negative adjustments (waste)
    const restockIngredient = useCallback(async (id: string, amount: number) => {
        await database.restockIngredient(id, amount);
        setIngredients(prev => prev.map(ing =>
            ing.id === id ? { ...ing, currentStock: ing.currentStock + amount, updatedAt: new Date() } : ing
        ));
    }, []);

    const addPurchase = useCallback(async (purchase: Omit<Purchase, 'id'>) => {
        // 1. Add Purchase Record
        const newPurchase = await database.addPurchase(purchase);

        // 2. Update Stock (Restock)
        await database.restockIngredient(purchase.ingredientId, purchase.quantity);

        // 3. Update Local State
        setPurchases(prev => [newPurchase, ...prev]);
        setIngredients(prev => prev.map(ing =>
            ing.id === purchase.ingredientId
                ? { ...ing, currentStock: ing.currentStock + purchase.quantity, updatedAt: new Date() }
                : ing
        ));
    }, []);

    const updateStock = restockIngredient;

    const getIngredientById = useCallback((id: string) => {
        return ingredients.find(ing => ing.id === id);
    }, [ingredients]);

    return (
        <InventoryContext.Provider value={{
            ingredients,
            lowStockAlerts,
            loading,
            error,
            refreshIngredients,
            addIngredient,
            updateIngredient,
            deleteIngredient,
            deductInventory,
            restockIngredient,
            updateStock,
            getIngredientById,
            purchases,
            addPurchase,
        }}>
            {children}
        </InventoryContext.Provider>
    );
}

export function useInventory() {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
}
