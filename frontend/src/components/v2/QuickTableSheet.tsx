import React from 'react';
import { X, Utensils, ShoppingBag, Check, User, Phone } from 'lucide-react';
import { haptics } from '../../services/haptics';

interface QuickTableSheetProps {
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  onSelectTable: (table: string) => void;
  onUpdateCustomerName: (name: string) => void;
  onUpdateCustomerPhone: (phone: string) => void;
  onClose: () => void;
}

const COMMON_TABLES = ['1', '2', '3', '4', '5', '6', '7', '8', 'Takeaway'];

export const QuickTableSheet: React.FC<QuickTableSheetProps> = ({
  tableNumber,
  customerName,
  customerPhone,
  onSelectTable,
  onUpdateCustomerName,
  onUpdateCustomerPhone,
  onClose
}) => {
  const handleTablePick = (num: string) => {
    haptics.tap();
    onSelectTable(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end items-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Handle & Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2 sm:hidden" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Select Table or Order Type</h3>
            <p className="text-xs text-slate-500">Tap to assign table for this order</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Quick Table Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Quick Table Selection
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COMMON_TABLES.map((t) => {
                const isSelected = tableNumber === t;
                const isTakeaway = t === 'Takeaway';
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTablePick(t)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95 ${
                      isSelected
                        ? 'bg-[#026cb6] text-white ring-2 ring-[#026cb6]/30'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isTakeaway ? (
                      <ShoppingBag className="w-3.5 h-3.5" />
                    ) : (
                      <Utensils className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{isTakeaway ? 'Takeaway' : `Table ${t}`}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Table Number Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Custom Table Number / Name
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => onSelectTable(e.target.value)}
              placeholder="e.g. 12, Patio-2, VIP"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#026cb6]"
            />
          </div>

          {/* Optional Guest Name & Phone */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => onUpdateCustomerName(e.target.value)}
                placeholder="Guest name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#026cb6]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => onUpdateCustomerPhone(e.target.value)}
                placeholder="e.g. 01712-XXXXXX"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#026cb6]"
              />
            </div>
          </div>
        </div>

        {/* Bottom Done Button */}
        <div className="p-3 bg-white border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

