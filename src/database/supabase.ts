import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDatabase } from '../types/database';
import { Ingredient, Product, Sale, Purchase, InventoryDeduction, User, ActiveOrder, OrderStatus } from '../types';

export class SupabaseDatabase implements IDatabase {
    private client: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.client = createClient(supabaseUrl, supabaseKey);
    }

    // ==========================================
    // Ingredients
    // ==========================================
    async getIngredients(): Promise<Ingredient[]> {
        const { data, error } = await this.client
            .from('ingredients')
            .select('*');

        if (error) throw error;
        return data.map(this.mapIngredient);
    }

    async getIngredientById(id: string): Promise<Ingredient | null> {
        const { data, error } = await this.client
            .from('ingredients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return this.mapIngredient(data);
    }

    async addIngredient(ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ingredient> {
        const { data, error } = await this.client
            .from('ingredients')
            .insert([{
                name: ingredient.name,
                current_stock: ingredient.currentStock,
                unit: ingredient.unit,
                cost_per_unit: ingredient.costPerUnit,
                low_stock_threshold: ingredient.lowStockThreshold
            }])
            .select()
            .single();

        if (error) throw error;
        return this.mapIngredient(data);
    }

    async updateIngredient(id: string, updates: Partial<Omit<Ingredient, 'id' | 'createdAt'>>): Promise<Ingredient> {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.currentStock !== undefined) dbUpdates.current_stock = updates.currentStock;
        if (updates.unit) dbUpdates.unit = updates.unit;
        if (updates.costPerUnit !== undefined) dbUpdates.cost_per_unit = updates.costPerUnit;
        if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold;

        // Add implicit updated_at
        dbUpdates.updated_at = new Date();

        const { data, error } = await this.client
            .from('ingredients')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapIngredient(data);
    }

    async deleteIngredient(id: string): Promise<void> {
        const { error } = await this.client
            .from('ingredients')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async restockIngredient(id: string, amount: number): Promise<Ingredient> {
        // We need to fetch current stock first or use an RPC if concurrency is a concern.
        // For simplicity, fetch -> update.
        // Ideally use: .rpc('restock_ingredient', { row_id: id, amount: amount })

        const ingredient = await this.getIngredientById(id);
        if (!ingredient) throw new Error('Ingredient not found');

        const newAmount = ingredient.currentStock + amount;

        return this.updateIngredient(id, { currentStock: newAmount });
    }

    // ==========================================
    // Products
    // ==========================================
    async getProducts(): Promise<Product[]> {
        const { data, error } = await this.client
            .from('products')
            .select(`
                *,
                product_ingredients (
                    ingredient_id,
                    quantity
                )
            `);

        if (error) throw error;
        return data.map(this.mapProduct);
    }

    async getProductById(id: string): Promise<Product | null> {
        const { data, error } = await this.client
            .from('products')
            .select(`
                *,
                product_ingredients (
                    ingredient_id,
                    quantity
                )
            `)
            .eq('id', id)
            .single();

        if (error) return null;
        return this.mapProduct(data);
    }

    async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
        // 1. Insert Product
        const { data: prodData, error: prodError } = await this.client
            .from('products')
            .insert([{
                name: product.name,
                price: product.price,
                description: product.description,
                category: product.category,
                is_active: product.isActive
            }])
            .select()
            .single();

        if (prodError) throw prodError;

        // 2. Insert Recipe Items
        if (product.recipe && product.recipe.length > 0) {
            const recipeItems = product.recipe.map(r => ({
                product_id: prodData.id,
                ingredient_id: r.ingredientId,
                quantity: r.quantity
            }));

            const { error: recipeError } = await this.client
                .from('product_ingredients')
                .insert(recipeItems);

            if (recipeError) {
                // Should rollback product here ideally
                console.error('Failed to save recipe', recipeError);
            }
        }

        // Return complete product
        return this.getProductById(prodData.id) as Promise<Product>;
    }

    async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.price !== undefined) dbUpdates.price = updates.price;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.category) dbUpdates.category = updates.category;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        dbUpdates.updated_at = new Date();

        const { error: prodError } = await this.client
            .from('products')
            .update(dbUpdates)
            .eq('id', id);

        if (prodError) throw prodError;

        // Handle Recipe Updates (Full replacement)
        if (updates.recipe) {
            // Delete old
            await this.client.from('product_ingredients').delete().eq('product_id', id);

            // Insert new
            if (updates.recipe.length > 0) {
                const newItems = updates.recipe.map(r => ({
                    product_id: id,
                    ingredient_id: r.ingredientId,
                    quantity: r.quantity
                }));
                await this.client.from('product_ingredients').insert(newItems);
            }
        }

        return this.getProductById(id) as Promise<Product>;
    }

    async deleteProduct(id: string): Promise<void> {
        const { error } = await this.client
            .from('products')
            .update({ is_active: false }) // Soft delete often better, but interface says delete
            // Actually let's do hard delete as per interface implication, or set isActive false
            // The interface says deleteProduct. Let's assume soft delete if we want to keep history, 
            // but for now hard delete to match mock behavior roughly.
            .eq('id', id);

        // Actually, let's just delete
        const { error: delError } = await this.client.from('products').delete().eq('id', id);
        if (delError) throw delError;
    }

    // ==========================================
    // Sales
    // ==========================================
    async getSales(): Promise<Sale[]> {
        const { data, error } = await this.client
            .from('sales')
            .select(`
                *,
                sale_items (
                    product_id,
                    product_name,
                    product_price,
                    quantity
                )
            `)
            .order('date', { ascending: false });

        if (error) throw error;
        return data.map(this.mapSale);
    }

    async getSaleById(id: string): Promise<Sale | null> {
        const { data, error } = await this.client
            .from('sales')
            .select(`
                *,
                sale_items (
                    product_id,
                    product_name,
                    product_price,
                    quantity
                )
            `)
            .eq('id', id)
            .single();

        if (error) return null;
        return this.mapSale(data);
    }

    async addSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
        // 1. Create Sale
        const { data: saleData, error: saleError } = await this.client
            .from('sales')
            .insert([{
                total: sale.total,
                payment_method: sale.paymentMethod,
                status: sale.status || 'completed',
                date: sale.date
            }])
            .select()
            .single();

        if (saleError) throw saleError;

        // 2. Create Items
        const items = sale.items.map(item => ({
            sale_id: saleData.id,
            product_id: item.productId,
            product_name: item.productName,
            product_price: item.unitPrice,
            quantity: item.quantity
        }));

        const { error: itemsError } = await this.client
            .from('sale_items')
            .insert(items);

        if (itemsError) throw itemsError;

        return this.getSaleById(saleData.id) as Promise<Sale>;
    }

    // ==========================================
    // Inventory Deductions
    // ==========================================
    async deductInventory(deductions: InventoryDeduction[]): Promise<void> {
        // This is tricky. We should ideally do this in a transaction or RPC.
        // For now, loop.
        for (const d of deductions) {
            const { data: ing } = await this.client.from('ingredients').select('current_stock').eq('id', d.ingredientId).single();
            if (ing) {
                const newStock = Math.max(0, ing.current_stock - d.amount);
                await this.client.from('ingredients').update({ current_stock: newStock }).eq('id', d.ingredientId);
            }
        }
    }

    // ==========================================
    // Purchases
    // ==========================================
    async getPurchases(): Promise<Purchase[]> {
        const { data, error } = await this.client
            .from('purchases')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return data.map(this.mapPurchase);
    }

    async addPurchase(purchase: Omit<Purchase, 'id'>): Promise<Purchase> {
        const { data, error } = await this.client
            .from('purchases')
            .insert([{
                ingredient_id: purchase.ingredientId,
                ingredient_name: purchase.ingredientName,
                quantity: purchase.quantity,
                cost: purchase.cost,
                date: purchase.date
            }])
            .select()
            .single();

        if (error) throw error;
        return this.mapPurchase(data);
    }


    // ==========================================
    // User Management
    // ==========================================
    async getUsers(): Promise<User[]> {
        const { data, error } = await this.client
            .from('users')
            .select('*');

        if (error) throw error;
        return data.map(this.mapUser);
    }

    async getUserByUsername(username: string): Promise<User | null> {
        const { data, error } = await this.client
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error) return null;
        return this.mapUser(data);
    }

    async addUser(user: Omit<User, 'id'>): Promise<User> {
        const { data, error } = await this.client
            .from('users')
            .insert([{
                username: user.username,
                name: user.name,
                role: user.role,
                password: user.password
            }])
            .select()
            .single();

        if (error) throw error;
        return this.mapUser(data);
    }

    async updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User> {
        const dbUpdates: any = {};
        if (updates.username) dbUpdates.username = updates.username;
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.password) dbUpdates.password = updates.password;

        const { data, error } = await this.client
            .from('users')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapUser(data);
    }

    async deleteUser(id: string): Promise<void> {
        const { error } = await this.client
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // ==========================================
    // Mappers
    // ==========================================
    private mapIngredient(row: any): Ingredient {
        return {
            id: row.id,
            name: row.name,
            currentStock: Number(row.current_stock),
            unit: row.unit,
            costPerUnit: Number(row.cost_per_unit),
            lowStockThreshold: Number(row.low_stock_threshold),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }

    private mapProduct(row: any): Product {
        return {
            id: row.id,
            name: row.name,
            price: Number(row.price),
            description: row.description,
            category: row.category,
            isActive: row.is_active,
            recipe: row.product_ingredients?.map((pi: any) => ({
                ingredientId: pi.ingredient_id,
                quantity: Number(pi.quantity)
            })) || [],
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }

    private mapSale(row: any): Sale {
        return {
            id: row.id,
            date: new Date(row.date),
            total: Number(row.total),
            paymentMethod: row.payment_method,
            status: row.status,
            items: row.sale_items?.map((si: any) => ({
                productId: si.product_id,
                productName: si.product_name,
                unitPrice: Number(si.product_price),
                quantity: Number(si.quantity),
                subtotal: Number(si.product_price) * Number(si.quantity)
            })) || []
        };
    }

    private mapPurchase(row: any): Purchase {
        return {
            id: row.id,
            ingredientId: row.ingredient_id,
            ingredientName: row.ingredient_name,
            quantity: Number(row.quantity),
            cost: Number(row.cost),
            date: new Date(row.date)
        };
    }

    private mapUser(row: any): User {
        return {
            id: row.id,
            username: row.username,
            name: row.name,
            role: row.role,
            password: row.password
        };
    }

    // ==========================================
    // Orders (Kitchen Queue)
    // ==========================================
    async getOrders(): Promise<ActiveOrder[]> {
        const { data, error } = await this.client
            .from('orders')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []).map(row => this.mapOrder(row));
    }

    async addOrder(order: Omit<ActiveOrder, 'id'>): Promise<ActiveOrder> {
        const { data, error } = await this.client
            .from('orders')
            .insert({
                customer_name: order.customerName,
                items: order.items,
                status: order.status,
                total: order.total,
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapOrder(data);
    }

    async updateOrderStatus(id: string, status: OrderStatus): Promise<ActiveOrder> {
        const { data, error } = await this.client
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapOrder(data);
    }

    async deleteOrder(id: string): Promise<void> {
        const { error } = await this.client
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    private mapOrder(row: any): ActiveOrder {
        return {
            id: row.id,
            customerName: row.customer_name,
            items: row.items,
            status: row.status,
            total: row.total,
            createdAt: new Date(row.created_at)
        };
    }

    // ==========================================
    // Categories
    // ==========================================
    async getCategories(): Promise<string[]> {
        const { data, error } = await this.client
            .from('categories')
            .select('name')
            .order('name', { ascending: true });

        if (error) throw error;
        return (data || []).map(row => row.name);
    }

    async addCategory(name: string): Promise<string> {
        const { data, error } = await this.client
            .from('categories')
            .insert([{ name }])
            .select()
            .single();

        if (error) throw error;
        return data.name;
    }

    async deleteCategory(name: string): Promise<void> {
        const { error } = await this.client
            .from('categories')
            .delete()
            .eq('name', name);

        if (error) throw error;
    }
}
