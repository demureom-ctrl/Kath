// ==========================================
// Database Abstraction Interface
// Implement this interface for Mock DB or Supabase
// ==========================================

import { User, ActiveOrder, OrderStatus } from './index';
import type { Ingredient, Product, Sale, InventoryDeduction, Purchase } from './index';

export interface IDatabase {
    // ==========================================
    // Ingredients (Raw Materials)
    // ==========================================
    getIngredients(): Promise<Ingredient[]>;
    getIngredientById(id: string): Promise<Ingredient | null>;
    addIngredient(ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ingredient>;
    updateIngredient(id: string, data: Partial<Omit<Ingredient, 'id' | 'createdAt'>>): Promise<Ingredient>;
    deleteIngredient(id: string): Promise<void>;

    // ==========================================
    // Products (Menu Items)
    // ==========================================
    getProducts(): Promise<Product[]>;
    getProductById(id: string): Promise<Product | null>;
    addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
    updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product>;
    deleteProduct(id: string): Promise<void>;

    // ==========================================
    // Sales
    // ==========================================
    getSales(): Promise<Sale[]>;
    getSaleById(id: string): Promise<Sale | null>;
    addSale(sale: Omit<Sale, 'id'>): Promise<Sale>;

    // ==========================================
    // Inventory Operations
    // ==========================================
    deductInventory(deductions: InventoryDeduction[]): Promise<void>;
    restockIngredient(id: string, amount: number): Promise<Ingredient>;

    // ==========================================
    // Purchases
    // ==========================================
    getPurchases(): Promise<Purchase[]>;
    addPurchase(purchase: Omit<Purchase, 'id'>): Promise<Purchase>;

    // ==========================================
    // User Management
    // ==========================================
    getUsers(): Promise<User[]>;
    getUserByUsername(username: string): Promise<User | null>;
    addUser(user: Omit<User, 'id'>): Promise<User>;
    updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User>;
    deleteUser(id: string): Promise<void>;

    // ==========================================
    // Orders (Kitchen Queue)
    // ==========================================
    getOrders(): Promise<ActiveOrder[]>;
    addOrder(order: Omit<ActiveOrder, 'id'>): Promise<ActiveOrder>;
    updateOrderStatus(id: string, status: OrderStatus): Promise<ActiveOrder>;
    deleteOrder(id: string): Promise<void>;
}

// Database configuration type (for future Supabase integration)
export interface DatabaseConfig {
    type: 'mock' | 'supabase';
    supabaseUrl?: string;
    supabaseAnonKey?: string;
}
