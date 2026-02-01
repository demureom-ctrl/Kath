// ==========================================
// Menu Page - Products & Recipes - Light Theme
// ==========================================

import { useState } from 'react';
import { Header } from '../components/Layout';
import { useProducts } from '../context/ProductsContext';
import { useInventory } from '../context/InventoryContext';
import { getProductIcon } from '../utils/productIcons';

import { formatCurrency } from '../utils/calculations';
import { Product, ProductIngredient } from '../types';

export function MenuPage() {
    const { products, productsWithYield, loading, addProduct, updateProduct, deleteProduct, categories } = useProducts();
    const { ingredients } = useInventory();
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const handleAdd = () => {
        setEditingProduct(null);
        setShowModal(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleToggleActive = async (product: Product) => {
        await updateProduct(product.id, { isActive: !product.isActive });
    };

    // Group products by category
    const productsByCategory = productsWithYield.reduce((acc, product) => {
        const category = product.category || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
    }, {} as Record<string, typeof productsWithYield>);

    return (
        <div className="flex flex-col h-screen pb-20">
            <Header
                title="Menu Setup"
                subtitle={`${products.length} products`}
            />

            <div className="flex-1 px-4 overflow-y-auto">
                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                        onClick={handleAdd}
                        className="p-4 border-2 border-dashed border-[#556c33]/30 rounded-2xl text-[#556c33] hover:bg-[#556c33]/5 transition-colors flex items-center justify-center gap-2 font-bold"
                    >
                        <span className="text-xl">+</span>
                        إضافة منتج
                    </button>
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="p-4 border-2 border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-bold"
                    >
                        <span>📂</span>
                        إدارة الأقسام
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 border-2 border-[#556c33] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6 pb-6">
                        {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                            <div key={category} className="animate-fade-in">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
                                    {category}
                                </h2>
                                <div className="space-y-3">
                                    {categoryProducts.map((product) => {
                                        const productIcon = getProductIcon(product.name);
                                        return (
                                            <div
                                                key={product.id}
                                                className={`bg-white rounded-2xl p-4 border border-gray-200 shadow-sm transition-opacity ${!product.isActive ? 'opacity-50' : ''}`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center">
                                                            <span className="text-3xl filter drop-shadow-sm">{productIcon}</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                                            <p className="text-[#556c33] font-bold">{formatCurrency(product.price)}</p>
                                                        </div>
                                                    </div>

                                                    {/* Toggle Active */}
                                                    <button
                                                        onClick={() => handleToggleActive(product)}
                                                        className={`relative w-12 h-6 rounded-full transition-colors ${product.isActive ? 'bg-green-500' : 'bg-gray-300'
                                                            }`}
                                                    >
                                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${product.isActive ? 'translate-x-6' : 'translate-x-0.5'
                                                            }`} />
                                                    </button>
                                                </div>

                                                {product.description && (
                                                    <p className="text-gray-500 text-sm mb-3">{product.description}</p>
                                                )}

                                                {/* Recipe Preview */}
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {product.recipe.map((item, idx) => {
                                                        const ingredient = ingredients.find(i => i.id === item.ingredientId);
                                                        return (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
                                                            >
                                                                {ingredient?.name || 'Unknown'}: {item.quantity}{ingredient?.unit?.charAt(0) || ''}
                                                            </span>
                                                        );
                                                    })}
                                                </div>

                                                {/* Yield Info */}
                                                <div className="flex items-center justify-between">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.maxYield === 0
                                                        ? 'bg-red-100 text-red-600'
                                                        : product.maxYield <= 5
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        Can make: {product.maxYield}
                                                    </span>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm(`هل أنت متأكد من حذف ${product.name}؟`)) {
                                                                    deleteProduct(product.id);
                                                                }
                                                            }}
                                                            className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-500 text-sm rounded-lg transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Product Modal */}
            {
                showModal && (
                    <ProductModal
                        product={editingProduct}
                        ingredients={ingredients}
                        onClose={() => setShowModal(false)}
                        onSave={async (data) => {
                            if (editingProduct) {
                                await updateProduct(editingProduct.id, data);
                            } else {
                                await addProduct(data as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
                            }
                            setShowModal(false);
                        }}
                    />
                )
            }

            {/* Category Management Modal */}
            <CategoryModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
            />
        </div >
    );
}

// Category Management Modal
function CategoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { categories, addCategory, deleteCategory } = useProducts();
    const [newCategory, setNewCategory] = useState('');

    const handleAdd = () => {
        if (newCategory.trim()) {
            addCategory(newCategory.trim());
            setNewCategory('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 text-xl">إدارة الأقسام</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
                </div>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="اسم القسم الجديد"
                        className="flex-1 p-2 border-2 border-gray-200 rounded-xl focus:border-[#556c33] focus:outline-none"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!newCategory.trim()}
                        className="px-4 bg-[#556c33] text-white rounded-xl font-bold disabled:opacity-50"
                    >
                        +
                    </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {categories.map(cat => (
                        <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="font-medium text-gray-700">{cat}</span>
                            <button
                                onClick={() => deleteCategory(cat)}
                                className="text-red-400 hover:text-red-600 p-1"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Product Modal Component
interface ProductModalProps {
    product: Product | null;
    ingredients: { id: string; name: string; unit: string }[];
    onClose: () => void;
    onSave: (data: Partial<Product>) => Promise<void>;
}

function ProductModal({ product, ingredients, onClose, onSave }: ProductModalProps) {
    const { categories } = useProducts(); // Get categories
    const [formData, setFormData] = useState({
        name: product?.name || '',
        price: product?.price?.toString() || '',
        description: product?.description || '',
        category: product?.category || (categories[0] || 'Hot Drinks'), // Default to first category
        isActive: product?.isActive ?? true,
        recipe: product?.recipe || [] as ProductIngredient[],
    });
    const [saving, setSaving] = useState(false);

    const addRecipeItem = () => {
        if (ingredients.length === 0) return;
        setFormData({
            ...formData,
            recipe: [...formData.recipe, { ingredientId: ingredients[0].id, quantity: 0 }],
        });
    };

    const updateRecipeItem = (index: number, field: 'ingredientId' | 'quantity', value: string | number) => {
        const newRecipe = [...formData.recipe];
        newRecipe[index] = { ...newRecipe[index], [field]: field === 'quantity' ? Number(value) : value };
        setFormData({ ...formData, recipe: newRecipe });
    };

    const removeRecipeItem = (index: number) => {
        setFormData({
            ...formData,
            recipe: formData.recipe.filter((_, i) => i !== index),
        });
    };

    const handleSubmit = async () => {
        setSaving(true);
        await onSave({
            name: formData.name,
            price: parseFloat(formData.price) || 0,
            description: formData.description,
            category: formData.category,
            isActive: formData.isActive,
            recipe: formData.recipe,
        });
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-t-3xl animate-slide-up max-h-[70vh] overflow-hidden shadow-2xl flex flex-col mb-16">
                <div className="flex justify-center py-3 flex-shrink-0">
                    <div className="w-12 h-1 bg-gray-300 rounded-full" />
                </div>

                <div className="px-6 pb-8 overflow-y-auto flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                        {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-2">اسم المنتج</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                placeholder="مثال: لاتيه"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">السعر (د.إ)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">القسم</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-500 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#556c33] resize-none"
                                rows={2}
                                placeholder="Optional description"
                            />
                        </div>

                        {/* Recipe Builder */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm text-gray-500">Recipe / Ingredients</label>
                                <button
                                    onClick={addRecipeItem}
                                    className="text-[#556c33] text-sm font-medium hover:underline"
                                >
                                    + Add Ingredient
                                </button>
                            </div>

                            <div className="space-y-2">
                                {formData.recipe.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <select
                                            value={item.ingredientId}
                                            onChange={(e) => updateRecipeItem(index, 'ingredientId', e.target.value)}
                                            className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                        >
                                            {ingredients.map((ing) => (
                                                <option key={ing.id} value={ing.id}>{ing.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateRecipeItem(index, 'quantity', e.target.value)}
                                            className="w-20 p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                            placeholder="Qty"
                                        />
                                        <button
                                            onClick={() => removeRecipeItem(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                {formData.recipe.length === 0 && (
                                    <p className="text-gray-400 text-sm text-center py-4">No ingredients added yet</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || !formData.name}
                            className="flex-1 py-3 bg-[#556c33] text-white rounded-xl font-medium disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MenuPage;
