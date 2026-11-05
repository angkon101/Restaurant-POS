import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, Utensils, MessageSquare, ArrowRight, ArrowLeft } from 'lucide-react';
import { MenuItem, Settings } from '../../types';

export interface QuickCartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

interface OrderConfirmSheetProps {
  items: QuickCartItem[];
  settings: Settings;
  customerName: string;
  orderType: 'TAKEAWAY' | 'DINE_IN';
  tableNumber: string;
  onUpdateCustomerName: (name: string) => void;
  onUpdateOrderType: (type: 'TAKEAWAY' | 'DINE_IN') => void;
  onUpdateTableNumber: (table: string) => void;
  onUpdateQuantity: (menuItemId: number, delta: number) => void;
  onUpdateNotes: (menuItemId: number, notes: string) => void;
  onRemoveItem: (menuItemId: number) => void;
  onClearCart: () => void;
  onClose: () => void;
  onProceedToPayment: () => void;
}

export const OrderConfirmSheet: React.FC<OrderConfirmSheetProps> = ({
  items,
  settings,
  customerName,
  orderType,
  tableNumber,
  onUpdateCustomerName,
  onUpdateOrderType,
  onUpdateTableNumber,
  onUpdateQuantity,
  onUpdateNotes,
  onRemoveItem,
  onClearCart,
  onClose,
  onProceedToPayment
}) => {
  const currency = settings?.currency_symbol || '৳';
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const subtotal = items.reduce((sum, it) => sum + (it.menuItem.price * it.quantity), 0);
  const grandTotal = subtotal;

  const handleOpenNote = (item: QuickCartItem) => {
    setEditingNoteId(item.menuItem.id);
    setNoteInput(item.notes);
  };

  const handleSaveNote = (menuItemId: number) => {
    onUpdateNotes(menuItemId, noteInput);
    setEditingNoteId(null);
    setNoteInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Top Handle / Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2 sm:hidden"></div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">Review &amp; Confirm Order</h3>
            <p className="text-xs text-slate-500">{items.reduce((sum, i) => sum + i.quantity, 0)} items selected</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Order Details */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Order Type Toggle (Takeaway vs Dine-In) */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => onUpdateOrderType('TAKEAWAY')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
                orderType === 'TAKEAWAY'
                  ? 'bg-[#026cb6] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Takeaway / Counter
            </button>
            <button
              type="button"
              onClick={() => onUpdateOrderType('DINE_IN')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
                orderType === 'DINE_IN'
                  ? 'bg-[#026cb6] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Utensils className="w-4 h-4" />
              Dine-In
            </button>
          </div>

          {/* Customer / Table Info */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Customer / Token</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => onUpdateCustomerName(e.target.value)}
                placeholder="e.g. Token #12 or John"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#026cb6]"
              />
            </div>
            {orderType === 'DINE_IN' ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Table No</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => onUpdateTableNumber(e.target.value)}
                  placeholder="e.g. T-03"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#026cb6]"
                />
              </div>
            ) : (
              <div className="flex items-center justify-end pt-5">
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-xs text-red-500 hover:underline"
                >
                  Clear all items
                </button>
              </div>
            )}
          </div>

          {/* Item List */}
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.menuItem.id}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-800">{it.menuItem.name}</h4>
                    <span className="text-xs text-slate-500">{currency}{it.menuItem.price.toFixed(2)} each</span>
                    {it.notes && (
                      <p className="text-[11px] font-semibold text-amber-600 mt-0.5">
                        *{it.notes}
                      </p>
                    )}
                  </div>
                  <span className="font-extrabold text-sm text-[#026cb6]">
                    {currency}{(it.menuItem.price * it.quantity).toFixed(2)}
                  </span>
                </div>

                {/* Inline Note Editor if opened */}
                {editingNoteId === it.menuItem.id ? (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      autoFocus
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Special note (e.g. no onions, extra spicy)"
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#026cb6]"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveNote(it.menuItem.id)}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveNote(it.menuItem.id)}
                      className="px-3 py-1 bg-[#026cb6] hover:bg-[#025a98] text-white rounded-xl text-xs font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleOpenNote(it)}
                      className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-amber-600 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {it.notes ? 'Edit Note' : '+ Add Note'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(it.menuItem.id, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs text-slate-800 w-4 text-center">{it.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(it.menuItem.id, 1)}
                        className="w-7 h-7 flex items-center justify-center bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] rounded-lg text-white transition shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(it.menuItem.id)}
                        className="p-1 text-slate-400 hover:text-red-500 ml-1 transition"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cost Summary Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div className="flex justify-between text-base font-bold text-slate-900">
              <span>Total Payable</span>
              <span className="text-[#026cb6] text-lg font-black">{currency}{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-2xl text-xs font-bold transition border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Add More
          </button>
          <button
            type="button"
            onClick={onProceedToPayment}
            className="flex-2 flex items-center justify-center gap-2 py-3 px-6 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-2xl text-sm font-extrabold shadow-md transition"
          >
            <span>Confirm &amp; Pay</span>
            <span className="bg-[#084c94] px-2 py-0.5 rounded-lg text-xs">{currency}{grandTotal.toFixed(2)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
