import React from 'react';
import { Plus, Minus, Utensils, Pizza, Flame, Coffee, IceCream } from 'lucide-react';
import { MenuItem } from '../../types';

interface QuickProductCardProps {
  item: MenuItem;
  quantity: number;
  currencySymbol: string;
  onAdd: (item: MenuItem) => void;
  onDecrement: (item: MenuItem) => void;
}

export const QuickProductCard: React.FC<QuickProductCardProps> = ({
  item,
  quantity,
  currencySymbol,
  onAdd,
  onDecrement
}) => {
  const isSelected = quantity > 0;

  // Food icon helper based on SKU or Category
  const getProductIcon = () => {
    const sku = item.sku || '';
    if (sku.startsWith('PIZ')) return Pizza;
    if (sku.startsWith('APP')) return Flame;
    if (sku.startsWith('DRK')) return Coffee;
    if (sku.startsWith('DST')) return IceCream;
    return Utensils;
  };

  const Icon = getProductIcon();

  return (
    <div
      onClick={() => onAdd(item)}
      className={`relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-150 cursor-pointer select-none active:scale-95 ${
        isSelected
          ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 shadow-sm'
      }`}
    >
      {/* Active Quantity Badge in top-right */}
      {isSelected && (
        <div className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full shadow-lg border-2 border-slate-950 flex items-center justify-center animate-in zoom-in-75">
          {quantity}x
        </div>
      )}

      {/* Card Body */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            <Icon className="w-5 h-5" />
          </div>
          {item.sku && (
            <span className="text-[10px] font-mono text-slate-500">{item.sku}</span>
          )}
        </div>

        <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight mb-1 line-clamp-2">
          {item.name}
        </h3>
        
        {item.description && (
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        )}
      </div>

      {/* Bottom Price & Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1" onClick={(e) => e.stopPropagation()}>
        <span className="font-black text-sm sm:text-base text-emerald-400">
          {currencySymbol}{item.price.toFixed(2)}
        </span>

        {isSelected ? (
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => onDecrement(item)}
              className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-200 transition"
              title="Minus 1"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-xs text-white px-1">{quantity}</span>
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="w-7 h-7 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 rounded-lg text-white transition shadow-sm"
              title="Add 1"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(item)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 active:bg-emerald-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition border border-slate-700 hover:border-emerald-500"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        )}
      </div>
    </div>
  );
};

