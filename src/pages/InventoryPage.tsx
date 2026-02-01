// ==========================================
// Inventory Page - Raw Materials Management - Light Theme
// ==========================================

import { useState } from 'react';
import { Header } from '../components/Layout';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatUnit } from '../utils/calculations';
import { Ingredient, UnitType } from '../types';

export function InventoryPage() {
    const {
        ingredients,
        lowStockAlerts,
        loading,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        restockIngredient
    } = useInventory();

    const [showModal, setShowModal] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [restockModal, setRestockModal] = useState<{ ingredient: Ingredient; amount: string } | null>(null);

    const handleAdd = () => {
        setEditingIngredient(null);
        setShowModal(true);
    };

    const handleEdit = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setShowModal(true);
    };

    const handleRestock = (ingredient: Ingredient) => {
        setRestockModal({ ingredient, amount: '' });
    };

    const handleRestockSubmit = async () => {
        if (!restockModal || !restockModal.amount) return;
        await restockIngredient(restockModal.ingredient.id, parseFloat(restockModal.amount));
        setRestockModal(null);
    };

    const getStockStatus = (ingredient: Ingredient) => {
        const percentage = (ingredient.currentStock / ingredient.lowStockThreshold) * 100;
        if (ingredient.currentStock <= ingredient.lowStockThreshold) {
            return { color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-100', label: 'Low' };
        }
        if (percentage <= 200) {
            return { color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100', label: 'Medium' };
        }
        return { color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-100', label: 'Good' };
    };

    return (
        <div className="flex flex-col min-h-screen pb-20">
            <Header
                title="Inventory"
                subtitle={`${ingredients.length} items • ${lowStockAlerts.length} low stock`}
            />

            <div className="flex-1 px-4 overflow-y-auto">
                {/* Low Stock Alert Banner */}
                {lowStockAlerts.length > 0 && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-red-600 font-medium">Low Stock Alert</span>
                        </div>
                        <p className="text-red-500 text-sm">
                            {lowStockAlerts.map(a => a.ingredient.name).join(', ')}
                        </p>
                    </div>
                )}

                {/* Add Button */}
                <button
                    onClick={handleAdd}
                    className="w-full mb-4 p-4 border-2 border-dashed border-[#556c33]/30 rounded-2xl text-[#556c33] hover:bg-[#556c33]/5 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Ingredient
                </button>

                {/* Ingredients List */}
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 border-2 border-[#556c33] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ingredients.map((ingredient, index) => {
                            const status = getStockStatus(ingredient);
                            return (
                                <div
                                    key={ingredient.id}
                                    className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm animate-fade-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{ingredient.name}</h3>
                                            <p className="text-gray-500 text-sm">
                                                Cost: {formatCurrency(ingredient.costPerUnit)}/{ingredient.unit}
                                                <span className="mx-2">|</span>
                                                Stock: <span className="font-medium text-gray-900">{ingredient.currentStock}</span> <span className="text-[#556c33] font-bold">{ingredient.unit}</span>
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    {/* Stock Bar */}
                                    <div className="mb-3">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-500">Current Stock</span>
                                            <span className="text-gray-900 font-medium">
                                                {formatUnit(ingredient.currentStock, ingredient.unit)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${status.color} transition-all duration-500`}
                                                style={{
                                                    width: `${Math.min(100, (ingredient.currentStock / (ingredient.lowStockThreshold * 3)) * 100)}%`
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Threshold: {formatUnit(ingredient.lowStockThreshold, ingredient.unit)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRestock(ingredient)}
                                            className="flex-1 py-2 px-3 bg-[#556c33] hover:bg-[#3e4f24] text-white text-sm rounded-xl transition-colors"
                                        >
                                            Restock
                                        </button>
                                        <button
                                            onClick={() => handleEdit(ingredient)}
                                            className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteIngredient(ingredient.id)}
                                            className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-500 text-sm rounded-xl transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <IngredientModal
                    ingredient={editingIngredient}
                    onClose={() => setShowModal(false)}
                    onSave={async (data) => {
                        if (editingIngredient) {
                            await updateIngredient(editingIngredient.id, data);
                        } else {
                            await addIngredient(data as Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>);
                        }
                        setShowModal(false);
                    }}
                />
            )}

            {/* Restock Modal */}
            {restockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRestockModal(null)} />
                    <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Restock {restockModal.ingredient.name}</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Current: {formatUnit(restockModal.ingredient.currentStock, restockModal.ingredient.unit)}
                        </p>
                        <input
                            type="number"
                            value={restockModal.amount}
                            onChange={(e) => setRestockModal({ ...restockModal, amount: e.target.value })}
                            placeholder={`Amount in ${restockModal.ingredient.unit}`}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 mb-4 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRestockModal(null)}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRestockSubmit}
                                className="flex-1 py-3 bg-[#556c33] text-white rounded-xl font-medium"
                            >
                                Add Stock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Ingredient Add/Edit Modal Component
interface IngredientModalProps {
    ingredient: Ingredient | null;
    onClose: () => void;
    onSave: (data: Partial<Ingredient>) => Promise<void>;
}

function IngredientModal({ ingredient, onClose, onSave }: IngredientModalProps) {
    const [formData, setFormData] = useState({
        name: ingredient?.name || '',
        currentStock: ingredient?.currentStock?.toString() || '',
        unit: ingredient?.unit || 'grams' as UnitType,
        costPerUnit: ingredient?.costPerUnit?.toString() || '',
        lowStockThreshold: ingredient?.lowStockThreshold?.toString() || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        setSaving(true);
        await onSave({
            name: formData.name,
            currentStock: parseFloat(formData.currentStock) || 0,
            unit: formData.unit,
            costPerUnit: parseFloat(formData.costPerUnit) || 0,
            lowStockThreshold: parseFloat(formData.lowStockThreshold) || 0,
        });
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-t-3xl animate-slide-up max-h-[70vh] overflow-y-auto shadow-2xl mb-16">
                <div className="flex justify-center py-3">
                    <div className="w-12 h-1 bg-gray-300 rounded-full" />
                </div>

                <div className="px-6 pb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                        {ingredient ? 'Edit Ingredient' : 'Add Ingredient'}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-2">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                placeholder="e.g., Coffee Beans"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Current Stock</label>
                                <input
                                    type="number"
                                    value={formData.currentStock}
                                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Unit</label>
                                <select
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitType })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                >
                                    <option value="grams">Grams</option>
                                    <option value="ml">Milliliters</option>
                                    <option value="pieces">Pieces</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Cost per Unit ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.costPerUnit}
                                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Low Stock Alert</label>
                                <input
                                    type="number"
                                    value={formData.lowStockThreshold}
                                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                    placeholder="0"
                                />
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

export default InventoryPage;
