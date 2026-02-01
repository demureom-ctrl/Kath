// ==========================================
// Products Context - Menu Items Management
// ==========================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Product, ProductWithYield } from '../types';
import { database } from '../database';
import { calculateMaxYield } from '../utils/calculations';
import { useInventory } from './InventoryContext';

interface ProductsContextType {
    products: Product[];
    productsWithYield: ProductWithYield[];
    categories: string[];
    loading: boolean;
    error: string | null;
    refreshProducts: () => Promise<void>;
    addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
    updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    getProductById: (id: string) => Product | undefined;
    getMaxYield: (productId: string) => number;
    addCategory: (category: string) => void;
    deleteCategory: (category: string) => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { ingredients } = useInventory();

    // Category State
    const [categories, setCategories] = useState<string[]>(() => {
        const saved = localStorage.getItem('categories');
        return saved ? JSON.parse(saved) : ['Hot Drinks', 'Cold Drinks', 'Food', 'Desserts'];
    });

    useEffect(() => {
        localStorage.setItem('categories', JSON.stringify(categories));
    }, [categories]);

    const addCategory = useCallback((category: string) => {
        setCategories(prev => {
            if (prev.includes(category)) return prev;
            return [...prev, category];
        });
    }, []);

    const deleteCategory = useCallback((category: string) => {
        setCategories(prev => prev.filter(c => c !== category));
    }, []);

    // Products with calculated yield based on current inventory
    const productsWithYield = useMemo<ProductWithYield[]>(() => {
        return products.map(product => ({
            ...product,
            maxYield: calculateMaxYield(product, ingredients),
        }));
    }, [products, ingredients]);

    const refreshProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await database.getProducts();
            setProducts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load products');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshProducts();
    }, [refreshProducts]);

    const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newProduct = await database.addProduct(product);
        setProducts(prev => [...prev, newProduct]);
        return newProduct;
    }, []);

    const updateProduct = useCallback(async (id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => {
        await database.updateProduct(id, data);
        setProducts(prev => prev.map(prod =>
            prod.id === id ? { ...prod, ...data, updatedAt: new Date() } : prod
        ));
    }, []);

    const deleteProduct = useCallback(async (id: string) => {
        await database.deleteProduct(id);
        setProducts(prev => prev.filter(prod => prod.id !== id));
    }, []);

    const getProductById = useCallback((id: string) => {
        return products.find(prod => prod.id === id);
    }, [products]);

    const getMaxYield = useCallback((productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return 0;
        return calculateMaxYield(product, ingredients);
    }, [products, ingredients]);

    return (
        <ProductsContext.Provider value={{
            products,
            productsWithYield,
            categories,
            loading,
            error,
            refreshProducts,
            addProduct,
            updateProduct,
            deleteProduct,
            getProductById,
            getMaxYield,
            addCategory,
            deleteCategory,
        }}>
            {children}
        </ProductsContext.Provider>
    );
}

export function useProducts() {
    const context = useContext(ProductsContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductsProvider');
    }
    return context;
}
