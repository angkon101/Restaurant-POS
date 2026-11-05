import React, { useState } from 'react';
import { Plus, Trash2, Utensils } from 'lucide-react';
import { Category, MenuItem } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  categories: Category[];
  menuItems: MenuItem[];
  currencySymbol?: string;
  onRefreshData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  categories,
  menuItems,
  currencySymbol = '৳',
  onRefreshData
}) => {
  // New item form state
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    category_id: categories[0]?.id || 1,
    price: 0,
    sku: '',
    description: '',
    is_available: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFilterCat, setSelectedFilterCat] = useState<number | 'ALL'>('ALL');

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuItem.name.trim() || newMenuItem.price <= 0) return;
    try {
      setIsSubmitting(true);
      await api.createMenuItem(newMenuItem);
      setNewMenuItem({
        name: '',
        category_id: categories[0]?.id || 1,
        price: 0,
        sku: '',
        description: '',
        is_available: true
      });
      setIsSubmitting(false);
      onRefreshData();
    } catch (err) {
      setIsSubmitting(false);
      alert((err as Error).message || 'Failed to add menu item');
    }
  };

  const handleToggleItemAvailability = async (item: MenuItem) => {
    try {
      await api.updateMenuItem(item.id, { is_available: !item.is_available });
      onRefreshData();
    } catch (err) {
      alert((err as Error).message || 'Failed to update item availability');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      try {
        await api.deleteMenuItem(itemId);
        onRefreshData();
      } catch (err) {
        alert((err as Error).message || 'Failed to delete item');
      }
    }
  };

  const displayedItems = menuItems.filter(item => {
    return selectedFilterCat === 'ALL' || item.category_id === selectedFilterCat;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-800 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#026cb6]" />
            Menu Catalog Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, update pricing, or toggle availability for your food and drink products
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 w-fit shadow-xs">
          {menuItems.length} Products in Catalog
        </span>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Form: Add Menu Item */}
        <form onSubmit={handleAddMenuItem} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-[#026cb6]" />
            Add New Product
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Product Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Chicken Biryani"
                value={newMenuItem.name}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#026cb6]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={newMenuItem.category_id}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, category_id: parseInt(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#026cb6]"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Price ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                placeholder="0.00"
                value={newMenuItem.price || ''}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, price: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#026cb6] font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">SKU Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. BIR-01"
                value={newMenuItem.sku}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, sku: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#026cb6] font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description (Optional)</label>
              <input
                type="text"
                placeholder="Brief ingredients or portion info"
                value={newMenuItem.description}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#026cb6]"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Add Product to Menu'}
            </button>
          </div>
        </form>

        {/* Existing Products List with Category Filter */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-extrabold text-sm text-slate-900">
              Menu Items ({displayedItems.length})
            </h3>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setSelectedFilterCat('ALL')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedFilterCat === 'ALL'
                    ? 'bg-[#026cb6] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedFilterCat(cat.id)}
                  className={`px-3 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                    selectedFilterCat === cat.id
                      ? 'bg-[#026cb6] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {displayedItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No products found in this category.
              </div>
            ) : (
              displayedItems.map(item => (
                <div key={item.id} className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">{item.name}</h4>
                      {item.sku && (
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.sku}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="font-black text-xs sm:text-sm text-[#026cb6]">
                      {currencySymbol}{item.price.toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleItemAvailability(item)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition ${
                        item.is_available
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Sold Out'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-slate-400 hover:text-red-500 p-1.5 transition rounded-lg hover:bg-slate-100"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
