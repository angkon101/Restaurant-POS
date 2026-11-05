import React, { useState, useMemo } from 'react';
import { Search, Plus, Utensils, Pizza, Flame, Coffee, IceCream, Sparkles } from 'lucide-react';
import { Category, MenuItem } from '../types';

interface MenuCatalogProps {
  categories: Category[];
  menuItems: MenuItem[];
  currencySymbol: string;
  onAddItem: (item: MenuItem, notes?: string) => void;
}

export const MenuCatalog: React.FC<MenuCatalogProps> = ({
  categories,
  menuItems,
  currencySymbol,
  onAddItem
}) => {
  const [selectedCatId, setSelectedCatId] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<MenuItem | null>(null);
  const [itemNote, setItemNote] = useState('');

  // Icon mapper helper
  const getCategoryIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'pizza': return Pizza;
      case 'flame': return Flame;
      case 'coffee': return Coffee;
      case 'icecream': return IceCream;
      default: return Utensils;
    }
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCat = selectedCatId === 'ALL' || item.category_id === selectedCatId;
      const matchesSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedCatId, searchQuery]);

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddItem(item, '');
  };

  const handleOpenNotes = (item: MenuItem) => {
    setSelectedItemForNotes(item);
    setItemNote('');
  };

  const handleConfirmWithNotes = () => {
    if (selectedItemForNotes) {
      onAddItem(selectedItemForNotes, itemNote);
      setSelectedItemForNotes(null);
      setItemNote('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Top Search & Filter Bar */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food, beverages, SKU..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Carousel / Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCatId('ALL')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              selectedCatId === 'ALL'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:border-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            All Items
          </button>
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  selectedCatId === cat.id
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Item Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-sm">
            <Utensils className="w-8 h-8 mb-2 stroke-1" />
            <p>No matching menu items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenNotes(item)}
                className="group relative flex flex-col justify-between p-3.5 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/70 hover:border-emerald-500/60 transition cursor-pointer shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex justify-between items-start gap-1 mb-1">
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition leading-snug line-clamp-2">
                      {item.name}
                    </h4>
                    {item.sku && (
                      <span className="text-[10px] text-slate-500 font-mono">{item.sku}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 mt-1">
                  <span className="text-sm font-black text-emerald-400">
                    {currencySymbol}{item.price.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(item, e)}
                    className="p-1.5 bg-slate-700 group-hover:bg-emerald-600 text-slate-200 group-hover:text-white rounded-lg transition shadow-sm"
                    title="Quick Add 1x"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Notes / Customization Modal */}
      {selectedItemForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <div>
              <h3 className="font-bold text-base text-white">{selectedItemForNotes.name}</h3>
              <p className="text-xs text-emerald-400 font-semibold">{currencySymbol}{selectedItemForNotes.price.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Special Kitchen Instructions (Optional)
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Extra spicy, no onions, sauce on side"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmWithNotes()}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Quick Note Pills */}
            <div className="flex flex-wrap gap-1.5">
              {['No Onions', 'Extra Spicy', 'Less Spicy', 'Sauce on side', 'Extra Crispy', 'Takeaway Box'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setItemNote(prev => prev ? `${prev}, ${preset}` : preset)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] text-slate-300 transition"
                >
                  +{preset}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemForNotes(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWithNotes}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
