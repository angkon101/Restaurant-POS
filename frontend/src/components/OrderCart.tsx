import React, { useState } from 'react';
import { Trash2, Plus, Minus, Send, Receipt, X, User, Edit3, CheckCircle } from 'lucide-react';
import { Table, MenuItem, Order, Settings } from '../types';
import { api } from '../services/api';
import { sound } from '../services/sound';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

interface OrderCartProps {
  selectedTable: Table | null;
  activeOrder: Order | null;
  stagedItems: CartItem[];
  settings: Settings;
  onUpdateQuantity: (menuItemId: number, delta: number) => void;
  onRemoveItem: (menuItemId: number) => void;
  onClearCart: () => void;
  onOrderSaved: (order: Order) => void;
  onOpenCheckout: (order: Order) => void;
  onClose: () => void;
}

export const OrderCart: React.FC<OrderCartProps> = ({
  selectedTable,
  activeOrder,
  stagedItems,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSaved,
  onOpenCheckout,
  onClose
}) => {
  const currency = settings?.currency_symbol || '$';
  const [waiterName, setWaiterName] = useState(activeOrder?.waiter_name || 'Staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Staged items calculation
  const stagedSubtotal = stagedItems.reduce((acc, it) => acc + (it.menuItem.price * it.quantity), 0);
  const activeSubtotal = activeOrder?.subtotal || 0;
  const combinedSubtotal = activeSubtotal + stagedSubtotal;
  
  const taxRate = settings?.tax_percentage || 5.0;
  const combinedTax = (combinedSubtotal * (taxRate / 100));
  const combinedTotal = combinedSubtotal + combinedTax;

  const handleSendToKitchen = async () => {
    if (stagedItems.length === 0) return;

    try {
      setIsSubmitting(true);

      const itemsPayload = stagedItems.map(it => ({
        menu_item_id: it.menuItem.id,
        quantity: it.quantity,
        notes: it.notes
      }));

      let savedOrder: Order;

      if (activeOrder) {
        // Append items as next round
        savedOrder = await api.appendOrderItems(activeOrder.id, {
          waiter_name: waiterName,
          items: itemsPayload
        });
      } else {
        // Create new order
        savedOrder = await api.createOrder({
          table_id: selectedTable?.id || null,
          order_type: selectedTable ? 'DINE_IN' : 'TAKEAWAY',
          waiter_name: waiterName,
          notes: orderNotes,
          items: itemsPayload
        });
      }

      sound.playKitchenBell();
      onClearCart();
      onOrderSaved(savedOrder);
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      alert((err as Error).message || 'Failed to submit order');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COOKING': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'READY': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'SERVED': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-slate-700/60 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 w-full max-w-md">
      {/* Header */}
      <div className="p-4 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-white">
              {selectedTable ? `${selectedTable.number} (${selectedTable.name})` : 'Takeaway / Counter'}
            </h3>
            {activeOrder && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                ACTIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <User className="w-3.5 h-3.5" />
            <input
              type="text"
              value={waiterName}
              onChange={(e) => setWaiterName(e.target.value)}
              placeholder="Server name"
              className="bg-transparent border-b border-dashed border-slate-600 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 max-w-[100px]"
            />
            {selectedTable && <span>• {selectedTable.section}</span>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Item List Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Existing active items sent previously */}
        {activeOrder && activeOrder.items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
              <span>Kitchen Sent Items ({activeOrder.items.length})</span>
              <span className="text-emerald-400">{currency}{activeSubtotal.toFixed(2)}</span>
            </div>

            <div className="space-y-1.5">
              {activeOrder.items.map((item) => (
                <div key={item.id} className="p-2.5 bg-slate-800/30 rounded-xl border border-slate-800 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-white">{item.quantity}x</span>
                      <span className="text-xs font-semibold text-slate-200">{item.item_name}</span>
                    </div>
                    {item.notes && (
                      <div className="text-[10px] text-amber-400/90 italic pl-5">*{item.notes}</div>
                    )}
                    <div className="text-[10px] text-slate-500 pl-5 mt-0.5 flex items-center gap-2">
                      <span>Round {item.kot_round}</span>
                      <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-300">
                    {currency}{item.total_price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staged Items (Waiting to be sent to kitchen) */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <span>New Items ({stagedItems.length})</span>
            {stagedItems.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-[10px] text-red-400 hover:underline lowercase font-normal"
              >
                clear all
              </button>
            )}
          </div>

          {stagedItems.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              {!activeOrder ? 'Tap menu items on the left to start order' : 'No new items staged. Tap menu to add another round.'}
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {stagedItems.map((item) => (
                <div key={item.menuItem.id} className="p-2.5 bg-slate-800/70 rounded-xl border border-slate-700/80 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white">{item.menuItem.name}</h4>
                      <span className="text-[11px] text-slate-400">{currency}{item.menuItem.price.toFixed(2)} each</span>
                      {item.notes && (
                        <p className="text-[10px] text-amber-400 italic">*{item.notes}</p>
                      )}
                    </div>
                    <span className="font-bold text-xs text-emerald-400">
                      {currency}{(item.menuItem.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.menuItem.id, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs text-white w-5 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.menuItem.id, 1)}
                        className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.menuItem.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Calculation & Action Buttons */}
      <div className="p-4 bg-slate-800/90 border-t border-slate-800 space-y-3">
        <div className="space-y-1.5 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-slate-200 font-medium">{currency}{combinedSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({taxRate}%)</span>
            <span className="text-slate-200 font-medium">{currency}{combinedTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-white pt-1 border-t border-slate-700">
            <span>Estimated Total</span>
            <span className="text-emerald-400 text-lg">{currency}{combinedTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {stagedItems.length > 0 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSendToKitchen}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-amber-950/40 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting
                ? 'Sending to Kitchen...'
                : activeOrder
                ? `Send Round to Kitchen (${currency}${stagedSubtotal.toFixed(2)})`
                : `Fire Order to Kitchen (${currency}${stagedSubtotal.toFixed(2)})`}
            </button>
          )}

          {activeOrder && (
            <button
              type="button"
              onClick={() => onOpenCheckout(activeOrder)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-950/30 transition"
            >
              <Receipt className="w-4 h-4" />
              Settle Bill & Print ({currency}{activeOrder.total_amount.toFixed(2)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

