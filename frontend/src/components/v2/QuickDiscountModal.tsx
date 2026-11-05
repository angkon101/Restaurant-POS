import React, { useState } from 'react';
import { X, Percent, Check } from 'lucide-react';
import { haptics } from '../../services/haptics';

interface QuickDiscountModalProps {
  isOpen: boolean;
  discountPercent: number;
  discountFlat: number;
  currencySymbol: string;
  subtotal: number;
  onApply: (percent: number, flat: number) => void;
  onClose: () => void;
}

export const QuickDiscountModal: React.FC<QuickDiscountModalProps> = ({
  isOpen,
  discountPercent,
  discountFlat,
  currencySymbol,
  subtotal,
  onApply,
  onClose
}) => {
  if (!isOpen) return null;

  const [selectedPercent, setSelectedPercent] = useState<number>(discountPercent);
  const [selectedFlat, setSelectedFlat] = useState<number>(discountFlat);
  const [activeType, setActiveType] = useState<'PERCENT' | 'FLAT'>(
    discountFlat > 0 ? 'FLAT' : 'PERCENT'
  );

  const calculateDiscount = () => {
    if (activeType === 'PERCENT') {
      return Math.round(subtotal * (selectedPercent / 100));
    }
    return Math.min(subtotal, selectedFlat);
  };

  const discountAmount = calculateDiscount();
  const finalSubtotal = Math.max(0, subtotal - discountAmount);

  const handleApply = () => {
    haptics.tap();
    if (activeType === 'PERCENT') {
      onApply(selectedPercent, 0);
    } else {
      onApply(0, selectedFlat);
    }
    onClose();
  };

  const handleClear = () => {
    haptics.tap();
    setSelectedPercent(0);
    setSelectedFlat(0);
    onApply(0, 0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-[#084c94] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
              <Percent className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight text-white">Order Discount</h3>
              <p className="text-[11px] text-blue-100">Apply percentage or flat deduction</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Percent vs Flat */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setActiveType('PERCENT');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              activeType === 'PERCENT'
                ? 'bg-[#026cb6] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Percentage (%)
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setActiveType('FLAT');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              activeType === 'FLAT'
                ? 'bg-[#026cb6] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Flat Amount ({currencySymbol})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4">
          {activeType === 'PERCENT' ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Select Percentage
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 5, 10, 15, 20, 25].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      setSelectedPercent(pct);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-extrabold border transition flex items-center justify-center gap-1 active:scale-95 ${
                      selectedPercent === pct
                        ? 'bg-[#026cb6] text-white border-[#026cb6] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{pct === 0 ? 'No Discount' : `${pct}%`}</span>
                    {selectedPercent === pct && <Check className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Select Flat Amount ({currencySymbol})
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[0, 50, 100, 200, 300, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      setSelectedFlat(amt);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-extrabold border transition flex items-center justify-center gap-1 active:scale-95 ${
                      selectedFlat === amt
                        ? 'bg-[#026cb6] text-white border-[#026cb6] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{amt === 0 ? 'No Flat' : `${currencySymbol}${amt}`}</span>
                    {selectedFlat === amt && <Check className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                ))}
              </div>

              {/* Custom amount input */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={selectedFlat === 0 ? '' : selectedFlat}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSelectedFlat(val);
                  }}
                  placeholder="Custom amount..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#026cb6]"
                />
              </div>
            </div>
          )}

          {/* Live Calculation Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-600 font-bold">
              <span>Discount Deduction:</span>
              <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-slate-200">
              <span>New Subtotal:</span>
              <span className="text-[#026cb6]">{currencySymbol}{finalSubtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="py-2.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition active:scale-95"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="col-span-2 py-2.5 rounded-xl text-xs font-extrabold bg-[#026cb6] hover:bg-[#084c94] text-white shadow-xs transition active:scale-95"
          >
            Apply Discount
          </button>
        </div>
      </div>
    </div>
  );
};
