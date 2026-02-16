// ==========================================
// Coffee Shop POS - Type Definitions
// ==========================================

export type UnitType = 'grams' | 'ml' | 'pieces';

// Raw Material / Ingredient
export interface Ingredient {
    id: string;
    name: string;
    currentStock: number;
    unit: UnitType;
    costPerUnit: number;
    lowStockThreshold: number;
    createdAt: Date;
    updatedAt: Date;
}

// Product Recipe Entry (One product has many of these)
export interface ProductIngredient {
    ingredientId: string;
    quantity: number; // Amount needed per product unit
}

// Menu Product
export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    recipe: ProductIngredient[]; // Composition
    imageUrl?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Sale Item (individual product in a sale)
export interface SaleItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

// Sale Transaction
export interface Sale {
    id: string;
    date: Date;
    items: SaleItem[];
    total: number;
    paymentMethod: 'cash' | 'card';
    status?: string;
    customerId?: string;
    discountAmount?: number;
    pointsRedeemed?: number;
}

// Cart Item (for POS)
export interface CartItem {
    product: Product;
    quantity: number;
}

// Low Stock Alert
export interface LowStockAlert {
    ingredient: Ingredient;
    currentStock: number;
    threshold: number;
    percentageRemaining: number;
}

// Inventory Deduction
export interface InventoryDeduction {
    ingredientId: string;
    amount: number;
}

// Product with calculated yield
export interface ProductWithYield extends Product {
    maxYield: number;
}

// Order Status (for Kitchen/Multi-order)
export type OrderStatus = 'pending' | 'ready';

// Purchase Transaction (Restocking)
export interface Purchase {
    id: string;
    ingredientId: string;
    ingredientName: string; // Snapshot name
    quantity: number;
    cost: number; // Total cost
    date: Date;
    supplier?: string;
}

// Active Order (Parked/Kitchen)
export interface ActiveOrder {
    id: string;
    customerName: string; // Car Number / Identifier
    items: CartItem[];
    status: OrderStatus;
    total: number;
    createdAt: Date;
    customerId?: string; // Link to Customer profile
}

// User roles
export type UserRole = 'admin' | 'staff';

// User interface
export interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    password?: string; // Optional for display, required for storage
}

// Customer Implementation
export interface Customer {
    id: string;
    name: string;
    phoneNumber: string;
    loyaltyPoints: number;
    totalSpent: number;
    lastTransactionDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
