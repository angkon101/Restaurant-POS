import React, { useState } from 'react';
import { Save, Plus, Trash2, CheckCircle2, Store, Utensils } from 'lucide-react';
import { Settings, Category, MenuItem } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  settings: Settings;
  categories: Category[];
  menuItems: MenuItem[];
  onRefreshData: () => void;
  onUpdateSettings: (s: Settings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  categories,
  menuItems,
  onRefreshData,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'MENU'>('GENERAL');
  const [formData, setFormData] = useState<Settings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Menu item form state
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    category_id: categories[0]?.id || 1,
    price: 0,
    sku: '',
    description: '',
    is_available: true
  });

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await api.updateSettings(formData);
      onUpdateSettings(updated);
      setSuccessMsg('Settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
      alert((err as Error).message || 'Failed to update settings');
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuItem.name.trim() || newMenuItem.price <= 0) return;
    try {
      await api.createMenuItem(newMenuItem);
      setNewMenuItem({
        name: '',
        category_id: categories[0]?.id || 1,
        price: 0,
        sku: '',
        description: '',
        is_available: true
      });
      onRefreshData();
    } catch (err) {
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

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'GENERAL', label: 'Restaurant & Receipt', icon: Store },
          { id: 'MENU', label: 'Menu Catalog Admin', icon: Utensils },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border ${
              activeTab === id
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* 1. GENERAL & THERMAL PRINTER SETTINGS */}
      {activeTab === 'GENERAL' && (
        <form onSubmit={handleSaveGeneral} className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-5 max-w-2xl">
          <h3 className="font-bold text-base text-white border-b border-slate-800 pb-2">Restaurant Profile</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Restaurant Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <h3 className="font-bold text-base text-white border-b border-slate-800 pb-2 pt-2">Billing &amp; Thermal Printer</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currency_symbol}
                onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Default Tax (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.tax_percentage}
                onChange={(e) => setFormData({ ...formData, tax_percentage: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Thermal Paper Size</label>
              <select
                value={formData.printer_paper_size}
                onChange={(e) => setFormData({ ...formData, printer_paper_size: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="80mm">80mm (Standard Full Roll)</option>
                <option value="58mm">58mm (Compact Mobile Roll)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Receipt Footer Note</label>
            <input
              type="text"
              value={formData.receipt_footer}
              onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* 2. MENU MANAGEMENT */}
      {activeTab === 'MENU' && (
        <div className="space-y-6 max-w-4xl">
          {/* Add Menu Item */}
          <form onSubmit={handleAddMenuItem} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="font-bold text-sm text-white">Add New Food / Drink Item</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Item Name (e.g. Garlic Naan)"
                value={newMenuItem.name}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <select
                value={newMenuItem.category_id}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, category_id: parseInt(e.target.value) })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={newMenuItem.price || ''}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, price: parseFloat(e.target.value) || 0 })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="SKU Code (e.g. APP-05)"
                value={newMenuItem.sku}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, sku: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Description"
                value={newMenuItem.description}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" />
              Save Item
            </button>
          </form>

          {/* Items Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h4 className="font-bold text-sm text-white">Menu Catalog ({menuItems.length} items)</h4>
            </div>
            <div className="divide-y divide-slate-800">
              {menuItems.map(item => (
                <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-xs text-white">{item.name}</h5>
                      {item.sku && <span className="text-[10px] text-slate-500 font-mono">({item.sku})</span>}
                    </div>
                    <p className="text-[11px] text-slate-400">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-xs text-emerald-400">
                      {formData.currency_symbol}{item.price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleItemAvailability(item)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition ${
                        item.is_available
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border-red-500/40'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Sold Out'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
