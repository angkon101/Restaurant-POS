import React, { useState } from 'react';
import { X, Banknote, CreditCard, Smartphone, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Settings } from '../../types';
import { QuickCartItem } from './OrderConfirmSheet';
import { api } from '../../services/api';
import { sound } from '../../services/sound';

interface QuickPaymentSheetProps {
  items: QuickCartItem[];
  settings: Settings;
  customerName: string;
  orderType: 'TAKEAWAY' | 'DINE_IN';
  tableNumber: string;
  onBack: () => void;
  onClose: () => void;
  onSuccess: (result: { order: any; payment: any }) => void;
}

export const QuickPaymentSheet: React.FC<QuickPaymentSheetProps> = ({
  items,
  settings,
  customerName,
  orderType,
  tableNumber,
  onBack,
  onClose,
  onSuccess
}) => {
  const currency = settings?.currency_symbol || '$';
  
  const subtotal = items.reduce((sum, it) => sum + (it.menuItem.price * it.quantity), 0);
  const taxRate = settings?.tax_percentage || 5.0;
  const taxAmount = (subtotal * (taxRate / 100));
  const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE'>('CASH');
  const [tenderedStr, setTenderedStr] = useState<string>(grandTotal.toFixed(2));
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const tenderedAmount = parseFloat(tenderedStr) || 0;
  const changeDue = Math.max(0, Math.round((tenderedAmount - grandTotal) * 100) / 100);

  const handleQuickCash = (amount: number) => {
    setTenderedStr(amount.toFixed(2));
  };

  const handleChargeOrder = async () => {
    if (paymentMethod === 'CASH' && tenderedAmount < grandTotal) {
      setErrorMsg('Tendered cash is less than the total bill amount!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const itemsPayload = items.map(it => ({
        menu_item_id: it.menuItem.id,
        quantity: it.quantity,
        notes: it.notes
      }));

      const result = await api.quickCheckout({
        customer_name: customerName || (orderType === 'DINE_IN' ? `Table ${tableNumber || '1'}` : 'Walk-in Guest'),
        order_type: orderType,
        waiter_name: 'Cashier',
        notes: orderType === 'DINE_IN' && tableNumber ? `Table: ${tableNumber}` : '',
        items: itemsPayload,
        payment_method: paymentMethod,
        amount_tendered: paymentMethod === 'CASH' ? tenderedAmount : grandTotal,
        change_returned: paymentMethod === 'CASH' ? changeDue : 0,
        reference: reference
      });

      sound.playCashRegister();
      onSuccess(result);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMsg((err as Error).message || 'Payment processing failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 overflow-hidden animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">Payment &amp; Settle</h3>
              <p className="text-xs text-slate-400">{orderType} • {customerName || 'Walk-in'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Big Amount Card */}
          <div className="text-center p-5 bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl border border-slate-800 shadow-inner">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Amount Due
            </span>
            <div className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
              {currency}{grandTotal.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Includes {currency}{taxAmount.toFixed(2)} tax ({taxRate}%)
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'CARD', label: 'Card', icon: CreditCard },
                { id: 'MOBILE', label: 'Mobile / QR', icon: Smartphone }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id as any)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all active:scale-95 ${
                    paymentMethod === id
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-1.5" />
                  <span className="text-xs font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Handling with Presets */}
          {paymentMethod === 'CASH' && (
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Amount Tendered</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">{currency}</span>
                <input
                  type="number"
                  step="0.01"
                  value={tenderedStr}
                  onChange={(e) => setTenderedStr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-lg font-black text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickCash(grandTotal)}
                  className="py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200 transition"
                >
                  Exact
                </button>
                {[10, 20, 50, 100].filter(amt => amt >= grandTotal).slice(0, 3).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200 transition"
                  >
                    {currency}{amt}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              <div className="flex justify-between items-center p-3 bg-slate-900 rounded-xl border border-slate-800 mt-2">
                <span className="text-xs text-slate-400">Change Due:</span>
                <span className={`text-base font-black ${changeDue > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {currency}{changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Card / Mobile Notes */}
          {paymentMethod !== 'CASH' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Transaction / Card Reference (Optional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Last 4 digits or Auth Code"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Bottom Charge Button */}
        <div className="p-4 bg-slate-850 border-t border-slate-800">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleChargeOrder}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl text-base font-black shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            {isSubmitting ? 'Charging Order...' : `Complete & Charge (${currency}${grandTotal.toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
};

