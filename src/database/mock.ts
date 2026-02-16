// ==========================================
// Mock Database Implementation (LocalStorage)
// ==========================================

import { IDatabase } from '../types/database';
import { Ingredient, Product, Sale, InventoryDeduction, Purchase, User, ActiveOrder, OrderStatus, Customer } from '../types';

const STORAGE_KEYS = {
    INGREDIENTS: 'coffee_shop_ingredients',
    PRODUCTS: 'coffee_shop_products',
    SALES: 'coffee_shop_sales',
    PURCHASES: 'coffee_shop_purchases',
    USERS: 'coffee_shop_users_list',
    CUSTOMERS: 'coffee_shop_customers',
};

// ==========================================
// Utility Functions
// ==========================================
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getFromStorage<T>(key: string, defaultValue: T): T {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return defaultValue;

        const parsed = JSON.parse(stored);

        // Convert date strings back to Date objects for sales
        if (key === STORAGE_KEYS.SALES) {
            return parsed.map((sale: any) => ({
                ...sale,
                date: new Date(sale.date),
            })) as T;
        }

        // Convert dates for ingredients, products, purchases, and customers
        if (key === STORAGE_KEYS.INGREDIENTS || key === STORAGE_KEYS.PRODUCTS || key === STORAGE_KEYS.PURCHASES || key === STORAGE_KEYS.CUSTOMERS) {
            return parsed.map((item: any) => ({
                ...item,
                createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
                updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
                date: item.date ? new Date(item.date) : undefined,
                lastTransactionDate: item.lastTransactionDate ? new Date(item.lastTransactionDate) : undefined,
            })) as T;
        }

        return parsed as T;
    } catch (error) {
        console.error(`Error reading from localStorage key ${key}:`, error);
        return defaultValue;
    }
}

function saveToStorage<T>(key: string, data: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error saving to localStorage key ${key}:`, error);
    }
}

// ==========================================
// Seed Data
// ==========================================
const SEED_INGREDIENTS: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { name: 'Coffee Beans', currentStock: 1000, unit: 'grams', costPerUnit: 0.05, lowStockThreshold: 200 },
    { name: 'Milk', currentStock: 5000, unit: 'ml', costPerUnit: 0.003, lowStockThreshold: 1000 },
    { name: 'Cups (Small)', currentStock: 100, unit: 'pieces', costPerUnit: 0.15, lowStockThreshold: 20 },
    { name: 'Cups (Large)', currentStock: 80, unit: 'pieces', costPerUnit: 0.20, lowStockThreshold: 15 },
    { name: 'Sugar', currentStock: 2000, unit: 'grams', costPerUnit: 0.002, lowStockThreshold: 300 },
    { name: 'Chocolate Syrup', currentStock: 500, unit: 'ml', costPerUnit: 0.02, lowStockThreshold: 100 },
    { name: 'Vanilla Syrup', currentStock: 400, unit: 'ml', costPerUnit: 0.025, lowStockThreshold: 80 },
    { name: 'Whipped Cream', currentStock: 300, unit: 'ml', costPerUnit: 0.03, lowStockThreshold: 50 },
];

// ==========================================
// Mock Database Class
// ==========================================
class MockDatabase implements IDatabase {
    private ingredients: Ingredient[] = [];
    private products: Product[] = [];
    private sales: Sale[] = [];
    private purchases: Purchase[] = [];
    private initialized = false;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        if (this.initialized) return;

        this.ingredients = getFromStorage<Ingredient[]>(STORAGE_KEYS.INGREDIENTS, []);
        this.products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
        this.sales = getFromStorage<Sale[]>(STORAGE_KEYS.SALES, []);
        this.purchases = getFromStorage<Purchase[]>(STORAGE_KEYS.PURCHASES, []);

        if (this.ingredients.length === 0) {
            this.seedIngredients();
        }

        if (this.products.length === 0) {
            this.seedProducts();
        }

        this.initialized = true;
    }

    private seedIngredients(): void {
        const now = new Date();
        this.ingredients = SEED_INGREDIENTS.map((ing) => ({
            ...ing,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        }));
        this.saveIngredients();
    }

    private seedProducts(): void {
        const now = new Date();
        const beans = this.ingredients.find(i => i.name === 'Coffee Beans');
        const milk = this.ingredients.find(i => i.name === 'Milk');
        const smallCup = this.ingredients.find(i => i.name === 'Cups (Small)');
        const largeCup = this.ingredients.find(i => i.name === 'Cups (Large)');
        const chocolate = this.ingredients.find(i => i.name === 'Chocolate Syrup');
        const vanilla = this.ingredients.find(i => i.name === 'Vanilla Syrup');

        if (!beans || !milk || !smallCup || !largeCup) return;

        this.products = [
            {
                id: generateId(),
                name: 'Espresso',
                price: 3.50,
                description: 'Rich and bold single shot espresso',
                category: 'Hot Drinks',
                recipe: [
                    { ingredientId: beans.id, quantity: 18 },
                    { ingredientId: smallCup.id, quantity: 1 },
                ],
                isActive: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: generateId(),
                name: 'Americano',
                price: 4.00,
                description: 'Espresso with hot water',
                category: 'Hot Drinks',
                recipe: [
                    { ingredientId: beans.id, quantity: 18 },
                    { ingredientId: smallCup.id, quantity: 1 },
                ],
                isActive: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: generateId(),
                name: 'Latte',
                price: 4.50,
                description: 'Espresso with steamed milk',
                category: 'Hot Drinks',
                recipe: [
                    { ingredientId: beans.id, quantity: 20 },
                    { ingredientId: milk.id, quantity: 150 },
                    { ingredientId: largeCup.id, quantity: 1 },
                ],
                isActive: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: generateId(),
                name: 'Cappuccino',
                price: 4.50,
                description: 'Espresso with steamed milk foam',
                category: 'Hot Drinks',
                recipe: [
                    { ingredientId: beans.id, quantity: 20 },
                    { ingredientId: milk.id, quantity: 100 },
                    { ingredientId: largeCup.id, quantity: 1 },
                ],
                isActive: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: generateId(),
                name: 'Mocha',
                price: 5.00,
                description: 'Espresso with chocolate and steamed milk',
                category: 'Hot Drinks',
                recipe: [
                    { ingredientId: beans.id, quantity: 20 },
                    { ingredientId: milk.id, quantity: 120 },
                    { ingredientId: chocolate?.id || '', quantity: 30 },
                    { ingredientId: largeCup.id, quantity: 1 },
                ],
                isActive: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: generateId(),
                name: 'Vanilla Latte',
                price: 5.00,
                description: 'Latte with vanilla syrup',
                category: 'Hot Drinks',
                recipe: [
                    { ingredientId: beans.id, quantity: 20 },
                    { ingredientId: milk.id, quantity: 150 },
                    { ingredientId: vanilla?.id || '', quantity: 20 },
                    { ingredientId: largeCup.id, quantity: 1 },
                ],
                isActive: true,
                createdAt: now,
                updatedAt: now,
            },
        ];
        this.saveProducts();
    }

    private saveIngredients(): void {
        saveToStorage(STORAGE_KEYS.INGREDIENTS, this.ingredients);
    }

    private saveProducts(): void {
        saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    }

    private saveSales(): void {
        saveToStorage(STORAGE_KEYS.SALES, this.sales);
    }

    private savePurchases(): void {
        saveToStorage(STORAGE_KEYS.PURCHASES, this.purchases);
    }

    async getIngredients(): Promise<Ingredient[]> {
        return [...this.ingredients];
    }

    async getIngredientById(id: string): Promise<Ingredient | null> {
        return this.ingredients.find(i => i.id === id) || null;
    }

    async addIngredient(ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ingredient> {
        const now = new Date();
        const newIngredient: Ingredient = {
            ...ingredient,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };
        this.ingredients.push(newIngredient);
        this.saveIngredients();
        return newIngredient;
    }

    async updateIngredient(id: string, data: Partial<Omit<Ingredient, 'id' | 'createdAt'>>): Promise<Ingredient> {
        const index = this.ingredients.findIndex(i => i.id === id);
        if (index === -1) throw new Error(`Ingredient with id ${id} not found`);

        this.ingredients[index] = {
            ...this.ingredients[index],
            ...data,
            updatedAt: new Date(),
        };
        this.saveIngredients();
        return this.ingredients[index];
    }

    async deleteIngredient(id: string): Promise<void> {
        const index = this.ingredients.findIndex(i => i.id === id);
        if (index === -1) throw new Error(`Ingredient with id ${id} not found`);
        this.ingredients.splice(index, 1);
        this.saveIngredients();
    }

    async getProducts(): Promise<Product[]> {
        return [...this.products];
    }

    async getProductById(id: string): Promise<Product | null> {
        return this.products.find(p => p.id === id) || null;
    }

    async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
        const now = new Date();
        const newProduct: Product = {
            ...product,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };
        this.products.push(newProduct);
        this.saveProducts();
        return newProduct;
    }

    async updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) throw new Error(`Product with id ${id} not found`);

        this.products[index] = {
            ...this.products[index],
            ...data,
            updatedAt: new Date(),
        };
        this.saveProducts();
        return this.products[index];
    }

    async deleteProduct(id: string): Promise<void> {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) throw new Error(`Product with id ${id} not found`);
        this.products.splice(index, 1);
        this.saveProducts();
    }

    async getSales(): Promise<Sale[]> {
        return [...this.sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    async getSaleById(id: string): Promise<Sale | null> {
        return this.sales.find(s => s.id === id) || null;
    }

    async addSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
        const newSale: Sale = {
            ...sale,
            id: generateId(),
            customerId: sale.customerId,
            discountAmount: sale.discountAmount || 0,
            pointsRedeemed: sale.pointsRedeemed || 0
        };
        this.sales.push(newSale);
        this.saveSales();
        return newSale;
    }

    async deductInventory(deductions: InventoryDeduction[]): Promise<void> {
        for (const { ingredientId, amount } of deductions) {
            const ingredient = this.ingredients.find(i => i.id === ingredientId);
            if (ingredient) {
                ingredient.currentStock = Math.max(0, ingredient.currentStock - amount);
                ingredient.updatedAt = new Date();
            }
        }
        this.saveIngredients();
    }

    async restockIngredient(id: string, amount: number): Promise<Ingredient> {
        const ingredient = this.ingredients.find(i => i.id === id);
        if (!ingredient) throw new Error(`Ingredient with id ${id} not found`);

        ingredient.currentStock += amount;
        ingredient.updatedAt = new Date();
        this.saveIngredients();
        return ingredient;
    }

    async getPurchases(): Promise<Purchase[]> {
        return [...this.purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    async addPurchase(purchase: Omit<Purchase, 'id'>): Promise<Purchase> {
        const newPurchase: Purchase = {
            ...purchase,
            id: generateId(),
        };
        this.purchases.push(newPurchase);
        this.savePurchases();
        return newPurchase;
    }

    async getUsers(): Promise<User[]> {
        return getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    }

    async getUserByUsername(username: string): Promise<User | null> {
        const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
        return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    }

    async addUser(user: Omit<User, 'id'>): Promise<User> {
        const newUser: User = {
            ...user,
            id: generateId(),
        };
        const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
        users.push(newUser);
        saveToStorage(STORAGE_KEYS.USERS, users);
        return newUser;
    }

    async updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User> {
        const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
        const index = users.findIndex(u => u.id === id);
        if (index === -1) throw new Error('User not found');

        users[index] = { ...users[index], ...data };
        saveToStorage(STORAGE_KEYS.USERS, users);
        return users[index];
    }

    async deleteUser(id: string): Promise<void> {
        const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
        const filtered = users.filter(u => u.id !== id);
        saveToStorage(STORAGE_KEYS.USERS, filtered);
    }

    async getOrders(): Promise<ActiveOrder[]> {
        const orders = getFromStorage<any[]>('activeOrders', []);
        return orders.map(o => ({
            ...o,
            createdAt: o.createdAt ? new Date(o.createdAt) : new Date()
        }));
    }

    async addOrder(order: Omit<ActiveOrder, 'id'>): Promise<ActiveOrder> {
        const orders = getFromStorage<ActiveOrder[]>('activeOrders', []);
        const newOrder: ActiveOrder = {
            ...order,
            id: generateId(),
        };
        orders.push(newOrder);
        saveToStorage('activeOrders', orders);
        return newOrder;
    }

    async updateOrderStatus(id: string, status: OrderStatus): Promise<ActiveOrder> {
        const orders = getFromStorage<ActiveOrder[]>('activeOrders', []);
        const index = orders.findIndex(o => o.id === id);
        if (index === -1) throw new Error('Order not found');
        orders[index] = { ...orders[index], status };
        saveToStorage('activeOrders', orders);
        return orders[index];
    }

    async deleteOrder(id: string): Promise<void> {
        const orders = getFromStorage<ActiveOrder[]>('activeOrders', []);
        const filtered = orders.filter(o => o.id !== id);
        saveToStorage('activeOrders', filtered);
    }

    // ==========================================
    // Categories
    // ==========================================
    async getCategories(): Promise<string[]> {
        return getFromStorage<string[]>('coffee_shop_categories', ['Hot Drinks', 'Cold Drinks', 'Food', 'Desserts']);
    }

    async addCategory(name: string): Promise<string> {
        const categories = await this.getCategories();
        if (!categories.includes(name)) {
            categories.push(name);
            saveToStorage('coffee_shop_categories', categories);
        }
        return name;
    }

    async deleteCategory(name: string): Promise<void> {
        const categories = await this.getCategories();
        const filtered = categories.filter(c => c !== name);
        saveToStorage('coffee_shop_categories', filtered);
    }

    // ==========================================
    // Customer Management
    // ==========================================
    async getCustomers(): Promise<Customer[]> {
        const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
        return customers.map(c => this.applyPointsExpiration(c));
    }

    async getCustomerByPhone(phone: string): Promise<Customer | null> {
        const customers = await this.getCustomers();
        return customers.find(c => c.phoneNumber === phone) || null;
    }

    async addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
        const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);

        // Check for duplicates
        if (customers.some(c => c.phoneNumber === customer.phoneNumber)) {
            throw new Error('Customer with this phone number already exists');
        }

        const now = new Date();
        const newCustomer: Customer = {
            ...customer,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };

        customers.push(newCustomer);
        saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
        return newCustomer;
    }

    async updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer> {
        const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
        const index = customers.findIndex(c => c.id === id);

        if (index === -1) throw new Error('Customer not found');

        customers[index] = {
            ...customers[index],
            ...data,
            updatedAt: new Date()
        };

        saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
        return customers[index];
    }

    async deleteCustomer(id: string): Promise<void> {
        const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
        const filtered = customers.filter(c => c.id !== id);
        saveToStorage(STORAGE_KEYS.CUSTOMERS, filtered);
    }

    private applyPointsExpiration(customer: Customer): Customer {
        if (!customer.lastTransactionDate) return customer;

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        if (new Date(customer.lastTransactionDate) < sixMonthsAgo) {
            return { ...customer, loyaltyPoints: 0 };
        }
        return customer;
    }
}

export const mockDatabase = new MockDatabase();
export default mockDatabase;