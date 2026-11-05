import React from 'react';
import { Minus, Plus } from 'lucide-react';
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
  const firstLetter = item.name.trim().charAt(0).toUpperCase();

  return (
    <div
      onClick={() => onAdd(item)}
      className="bg-white rounded-xl shadow-sm border border-slate-200/80 hover:border-blue-400 overflow-hidden flex flex-col justify-between transition-all active:scale-[0.98] select-none cursor-pointer"
    >
      {/* Product Image / Placeholder Letter Header with Floating Price Tag */}
      <div className="relative w-full h-24 sm:h-28 bg-slate-50 flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Fallback to letter on image error
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}

        {/* Fallback Letter Avatar if no image or image hidden */}
        <span className="text-3xl sm:text-4xl font-black text-slate-800 tracking-wider absolute">
          {firstLetter}
        </span>

        {/* Price Badge in Top-Right Corner */}
        <div className="absolute top-1.5 right-1.5 bg-black/85 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-0.5">
          <span>{currencySymbol}</span>
          <span>{item.price.toFixed(0)}</span>
        </div>
      </div>

      {/* Middle: Title */}
      <div className="px-2 pt-2 pb-1 text-center">
        <h4 className="font-bold text-[11px] sm:text-xs text-slate-800 leading-snug line-clamp-2 min-h-[28px] flex items-center justify-center">
          {item.name}
        </h4>
      </div>

      {/* Bottom: Stepper Row with Red (-) and Green (+) */}
      <div
        className="px-2 pb-2.5 pt-1 flex items-center justify-center gap-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onDecrement(item)}
          disabled={quantity <= 0}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold transition shadow-sm active:scale-90 ${
            quantity > 0
              ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
              : 'bg-red-200 text-red-100 cursor-not-allowed opacity-50'
          }`}
          title="Decrease"
        >
          <Minus className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        <span className="font-bold text-xs sm:text-sm text-slate-800 w-4 text-center">
          {quantity}
        </span>

        <button
          type="button"
          onClick={() => onAdd(item)}
          className="w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 active:scale-90 text-white flex items-center justify-center font-bold transition shadow-sm"
          title="Increase"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
