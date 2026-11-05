import React from 'react';
import { X, Trash2, Plus, Minus, CreditCard, AlertTriangle, FileText } from 'lucide-react';
import { QuickCartItem } from './OrderConfirmSheet';
import { MenuItem } from '../../types';
import { haptics } from '../../services/haptics';

const COMMON_CHEF_NOTES = ['Less Spicy', 'Extra Spicy', 'No Onion', 'Extra Sauce', 'Pack Separate'];

interface MobileBillSheetProps {
  isOpen: boolean;
  cartItems: QuickCartItem[];
  currencySymbol: string;
  tableNumber: string;
  customerName: string;
  rawSubtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  onAddItem: (item: MenuItem) => void;
  onDecrementItem: (item: MenuItem) => void;
  onRemoveItem: (itemId: number) => void;
  onUpdateItemNote: (itemId: number, note: string) => void;
  onOpenDiscount: () => void;
  onOpenCustomer: () => void;
  onOpenPayment: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

export const MobileBillSheet: React.FC<MobileBillSheetProps> = ({
  isOpen,
  cartItems,
  currencySymbol,
  tableNumber,
  customerName,
  rawSubtotal,
  discountAmount,
  taxRate,
  taxAmount,
  grandTotal,
  onAddItem,
  onDecrementItem,
  onRemoveItem,
  onUpdateItemNote,
  onOpenDiscount,
  onOpenCustomer,
  onOpenPayment,
  onDiscard,
  onClose
}) => {
  if (!isOpen) return null;

  const totalItemCount = cartItems.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl z-10 flex flex-col max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom duration-250 border-t border-slate-200">
        
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#026cb6] flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Order Bill</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#026cb6] text-white">
                  {tableNumber.toLowerCase().includes('takeaway') ? 'Takeaway' : `Table ${tableNumber}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {customerName ? `Guest: ${customerName}` : 'Walk-in Customer'} • {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 overscroll-contain">
          {cartItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Your cart is currently empty.
            </div>
          ) : (
            cartItems.map((it) => (
              <div
                key={it.menuItem.id}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-xs text-slate-900 leading-tight">{it.menuItem.name}</h4>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {currencySymbol}{it.menuItem.price.toFixed(2)} each
                    </span>
                    {it.notes && (
                      <p className="text-[10px] text-amber-700 font-bold leading-tight mt-0.5">
                        *{it.notes}
                      </p>
                    )}
                  </div>
                  <span className="font-black text-xs text-[#026cb6]">
                    {currencySymbol}{(it.menuItem.price * it.quantity).toFixed(2)}
                  </span>
                </div>

                {/* Chef Notes & Stepper Row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                    {COMMON_CHEF_NOTES.slice(0, 3).map((note) => (
                      <button
                        key={note}
                        type="button"
                        onClick={() => onUpdateItemNote(it.menuItem.id, note)}
                        className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-semibold text-slate-600 hover:bg-slate-100 whitespace-nowrap active:scale-95"
                      >
                        +{note}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <button
                      type="button"
                      onClick={() => {
                        haptics.tap();
                        onDecrementItem(it.menuItem);
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500 text-white active:scale-90 shadow-xs"
                      title="Decrease"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <span className="font-black text-xs w-5 text-center">{it.quantity}</span>
                    <button
                      type="button"
                      onClick={() => {
                        haptics.tap();
                        onAddItem(it.menuItem);
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-600 text-white active:scale-90 shadow-xs"
                      title="Increase"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(it.menuItem.id)}
                      className="p-1 text-slate-400 hover:text-red-500 ml-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary Breakdown */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1 text-xs shrink-0">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-800">{currencySymbol}{rawSubtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-1.5">
              <span>Discount:</span>
              <button
                type="button"
                onClick={onOpenDiscount}
                className="text-[10px] font-bold text-[#026cb6] underline"
              >
                {discountAmount > 0 ? 'Edit' : 'Add'}
              </button>
            </span>
            <span className={discountAmount > 0 ? 'font-bold text-red-600' : 'text-slate-400'}>
              {discountAmount > 0 ? `-${currencySymbol}${discountAmount.toFixed(2)}` : `${currencySymbol}0.00`}
            </span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>Tax ({taxRate}%):</span>
            <span className="font-semibold text-slate-800">{currencySymbol}{taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
            <span>Total Payable:</span>
            <span className="text-base text-[#026cb6] font-black">{currencySymbol}{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-3 bg-white border-t border-slate-200 grid grid-cols-3 gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDiscard();
            }}
            disabled={cartItems.length === 0}
            className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 active:scale-95 shadow-xs"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPayment();
            }}
            disabled={cartItems.length === 0}
            className="col-span-2 py-3 bg-[#084c94] hover:bg-[#063870] text-white rounded-xl text-xs font-black transition disabled:opacity-40 active:scale-95 shadow-md flex items-center justify-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span>Settle &amp; Pay ({currencySymbol}{grandTotal.toFixed(2)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
