// ==========================================
// Orders Context - Multi-Order & Kitchen Management
// Now uses database API for cross-device sync
// ==========================================

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ActiveOrder, CartItem, OrderStatus } from '../types';
import { calculateCartTotal } from '../utils/calculations';
import database from '../database';

interface OrdersContextType {
    activeOrders: ActiveOrder[];
    loading: boolean;
    createOrder: (customerName: string, items: CartItem[], customerId?: string) => Promise<void>;
    updateOrder: (id: string, items: CartItem[]) => void;
    updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
    deleteOrder: (id: string) => Promise<void>;
    getOrder: (id: string) => ActiveOrder | undefined;
    refreshOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
    const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch orders from database
    const refreshOrders = useCallback(async () => {
        try {
            const orders = await database.getOrders();
            // Filter out completed orders (only show pending and ready)
            const activeOnly = orders.filter(o => o.status === 'pending' || o.status === 'ready');
            setActiveOrders(activeOnly);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        refreshOrders();
    }, [refreshOrders]);

    // Poll database every 3 seconds for new orders
    useEffect(() => {
        const pollInterval = setInterval(() => {
            refreshOrders();
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [refreshOrders]);

    const createOrder = async (customerName: string, items: CartItem[], customerId?: string) => {
        try {
            await database.addOrder({
                customerName,
                items,
                status: 'pending',
                total: calculateCartTotal(items),
                createdAt: new Date(),
                customerId
            });
            await refreshOrders();
        } catch (error) {
            console.error('Failed to create order:', error);
            throw error;
        }
    };

    const updateOrder = (id: string, items: CartItem[]) => {
        // Local update for immediate feedback (items update not via DB for now)
        setActiveOrders(prev => prev.map(order =>
            order.id === id
                ? { ...order, items, total: calculateCartTotal(items) }
                : order
        ));
    };

    const updateOrderStatus = async (id: string, status: OrderStatus) => {
        try {
            await database.updateOrderStatus(id, status);
            await refreshOrders();
        } catch (error) {
            console.error('Failed to update order status:', error);
            throw error;
        }
    };

    const deleteOrder = async (id: string) => {
        try {
            await database.deleteOrder(id);
            await refreshOrders();
        } catch (error) {
            console.error('Failed to delete order:', error);
            throw error;
        }
    };

    const getOrder = (id: string) => {
        return activeOrders.find(o => o.id === id);
    };

    return (
        <OrdersContext.Provider value={{
            activeOrders,
            loading,
            createOrder,
            updateOrder,
            updateOrderStatus,
            deleteOrder,
            getOrder,
            refreshOrders,
        }}>
            {children}
        </OrdersContext.Provider>
    );
}

export function useOrders() {
    const context = useContext(OrdersContext);
    if (!context) {
        throw new Error('useOrders must be used within an OrdersProvider');
    }
    return context;
}
