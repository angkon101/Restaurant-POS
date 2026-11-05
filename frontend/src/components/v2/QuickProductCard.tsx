import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { MenuItem } from '../../types';
import { haptics } from '../../services/haptics';

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

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.tap();
    onAdd(item);
  };

  const handleDecrementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.tap();
    onDecrement(item);
  };

  const handleCardTap = () => {
    haptics.tap();
    onAdd(item);
  };

  return (
    <div
      onClick={handleCardTap}
      className={`bg-white rounded-xl shadow-xs border transition-all active:scale-[0.97] select-none cursor-pointer flex flex-col justify-between overflow-hidden touch-manipulation ${
        quantity > 0 ? 'border-[#026cb6]/60 ring-1 ring-[#026cb6]/20' : 'border-slate-200/90 hover:border-slate-300'
      }`}
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
        <div className="absolute top-1.5 right-1.5 bg-black/85 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs z-10 flex items-center gap-0.5">
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
        className="px-2 pb-2.5 pt-1 flex items-center justify-center gap-2.5 sm:gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleDecrementClick}
          disabled={quantity <= 0}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold transition shadow-xs active:scale-90 touch-manipulation ${
            quantity > 0
              ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-red-500/20'
              : 'bg-red-100/70 text-red-300 border border-red-200/50 cursor-not-allowed opacity-60'
          }`}
          title="Decrease"
        >
          <Minus className="w-5 h-5 stroke-[3]" />
        </button>

        <span className="font-black text-sm sm:text-base text-slate-800 w-6 text-center select-none">
          {quantity}
        </span>

        <button
          type="button"
          onClick={handleAddClick}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 active:scale-90 text-white flex items-center justify-center font-bold transition shadow-xs shadow-emerald-500/20 touch-manipulation"
          title="Increase"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
