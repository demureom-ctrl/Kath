// ==========================================
// Utility Functions - Calculations
// ==========================================

import type { Product, Ingredient, LowStockAlert, CartItem, InventoryDeduction } from '../types';

/**
 * Calculate the maximum number of units that can be produced
 * for a given product based on current ingredient stock.
 * 
 * Logic: Min(Stock_A / Required_A, Stock_B / Required_B, ...)
 */
export function calculateMaxYield(
    product: Product,
    ingredients: Ingredient[]
): number {
    if (product.recipe.length === 0) return 0;

    const yields = product.recipe.map(recipeItem => {
        const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);

        if (!ingredient) {
            console.warn(`Ingredient ${recipeItem.ingredientId} not found for product ${product.name}`);
            return 0;
        }

        if (recipeItem.quantity === 0) {
            return Infinity; // If no quantity required, don't limit
        }

        return Math.floor(ingredient.currentStock / recipeItem.quantity);
    });

    const minYield = Math.min(...yields);
    return minYield === Infinity ? 0 : minYield;
}

/**
 * Calculate inventory deductions required for a cart
 */
export function calculateDeductions(
    cart: CartItem[],
    products: Product[]
): InventoryDeduction[] {
    const deductionMap = new Map<string, number>();

    for (const cartItem of cart) {
        const product = products.find(p => p.id === cartItem.product.id);
        if (!product) continue;

        for (const recipeItem of product.recipe) {
            const currentAmount = deductionMap.get(recipeItem.ingredientId) || 0;
            deductionMap.set(
                recipeItem.ingredientId,
                currentAmount + (recipeItem.quantity * cartItem.quantity)
            );
        }
    }

    return Array.from(deductionMap.entries()).map(([ingredientId, amount]) => ({
        ingredientId,
        amount,
    }));
}

/**
 * Check if a sale can be completed based on current inventory
 */
export function canCompleteSale(
    cart: CartItem[],
    ingredients: Ingredient[]
): { canComplete: boolean; missingItems: { ingredientName: string; needed: number; available: number }[] } {
    const deductionMap = new Map<string, number>();
    const missingItems: { ingredientName: string; needed: number; available: number }[] = [];

    // Calculate total needed for each ingredient
    for (const cartItem of cart) {
        for (const recipeItem of cartItem.product.recipe) {
            const currentAmount = deductionMap.get(recipeItem.ingredientId) || 0;
            deductionMap.set(
                recipeItem.ingredientId,
                currentAmount + (recipeItem.quantity * cartItem.quantity)
            );
        }
    }

    // Check if we have enough stock
    for (const [ingredientId, needed] of deductionMap) {
        const ingredient = ingredients.find(i => i.id === ingredientId);
        if (!ingredient) {
            missingItems.push({
                ingredientName: `Unknown (${ingredientId})`,
                needed,
                available: 0,
            });
        } else if (ingredient.currentStock < needed) {
            missingItems.push({
                ingredientName: ingredient.name,
                needed,
                available: ingredient.currentStock,
            });
        }
    }

    return {
        canComplete: missingItems.length === 0,
        missingItems,
    };
}

/**
 * Get all ingredients that are below their low stock threshold
 */
export function getLowStockAlerts(ingredients: Ingredient[]): LowStockAlert[] {
    return ingredients
        .filter(ing => ing.currentStock <= ing.lowStockThreshold)
        .map(ing => ({
            ingredient: ing,
            currentStock: ing.currentStock,
            threshold: ing.lowStockThreshold,
            percentageRemaining: ing.lowStockThreshold > 0
                ? (ing.currentStock / ing.lowStockThreshold) * 100
                : 0,
        }))
        .sort((a, b) => a.percentageRemaining - b.percentageRemaining);
}

/**
 * Calculate total cart value
 */
export function calculateCartTotal(cart: CartItem[]): number {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-OM', {
        style: 'currency',
        currency: 'OMR',
    }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

/**
 * Format unit with quantity
 */
export function formatUnit(quantity: number, unit: string): string {
    return `${quantity} ${unit}`;
}
