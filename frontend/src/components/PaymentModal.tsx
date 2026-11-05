import React, { useState } from 'react';
import { CreditCard, Banknote, Smartphone, Split, X, CheckCircle2, Percent, DollarSign } from 'lucide-react';
import { Order, Settings, Payment } from '../types';
import { api } from '../services/api';
import { sound } from '../services/sound';

interface PaymentModalProps {
  order: Order;
  settings: Settings;
  onClose: () => void;
  onPaymentSuccess: (payment: Payment) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  settings,
  onClose,
  onPaymentSuccess
}) => {
  const currency = settings?.currency_symbol || '$';

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE' | 'SPLIT'>('CASH');
  const [tenderedStr, setTenderedStr] = useState<string>(order.total_amount.toFixed(2));
  const [reference, setReference] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(order.discount_percent || 0);
  const [discountFlat, setDiscountFlat] = useState<number>(order.discount_amount || 0);
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Bill calculations preview
  const subtotal = order.subtotal;
  let calculatedDiscount = 0;
  if (discountType === 'percent') {
    calculatedDiscount = round(subtotal * (discountPercent / 100));
  } else {
    calculatedDiscount = Math.min(subtotal, discountFlat);
  }

  const afterDiscount = Math.max(0, subtotal - calculatedDiscount);
  const calculatedTax = round(afterDiscount * (order.tax_percent / 100));
  const grandTotal = round(afterDiscount + calculatedTax + order.service_charge);

  const tenderedNumber = parseFloat(tenderedStr) || 0;
  const changeDue = Math.max(0, tenderedNumber - grandTotal);

  function round(val: number) {
    return Math.round(val * 100) / 100;
  }

  const handleApplyDiscount = async () => {
    try {
      setIsSubmitting(true);
      await api.updateOrderBill(order.id, {
        discount_percent: discountType === 'percent' ? discountPercent : 0,
        discount_amount: discountType === 'flat' ? discountFlat : 0,
      });
      setIsSubmitting(false);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMsg((err as Error).message || 'Failed to update discount');
    }
  };

  const handleQuickCash = (amount: number) => {
    setTenderedStr(amount.toFixed(2));
  };

  const handleSubmitPayment = async () => {
    if (paymentMethod === 'CASH' && tenderedNumber < grandTotal) {
      setErrorMsg('Tendered cash is less than the grand total!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      // If discount changed, update bill first
      if (discountPercent !== order.discount_percent || discountFlat !== order.discount_amount) {
        await api.updateOrderBill(order.id, {
          discount_percent: discountType === 'percent' ? discountPercent : 0,
          discount_amount: discountType === 'flat' ? discountFlat : 0,
        });
      }

      const payment = await api.processPayment(order.id, {
        amount: grandTotal,
        payment_method: paymentMethod,
        amount_tendered: paymentMethod === 'CASH' ? tenderedNumber : grandTotal,
        change_returned: paymentMethod === 'CASH' ? changeDue : 0,
        reference: reference
      });

      sound.playCashRegister();
      onPaymentSuccess(payment);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMsg((err as Error).message || 'Payment processing failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto no-print">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div>
            <h3 className="font-bold text-lg text-white">Settle Bill & Checkout</h3>
            <p className="text-xs text-slate-400">Order #{order.order_number} {order.table_id ? `• Table #${order.table_id}` : '• Takeaway'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Bill Summary Box */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal ({order.items.length} items)</span>
              <span className="font-medium text-slate-200">{currency}{subtotal.toFixed(2)}</span>
            </div>

            {/* Discount selector */}
            <div className="pt-2 border-t border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Apply Discount</span>
                <div className="flex gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-2 py-0.5 rounded ${discountType === 'percent' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    % Percent
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`px-2 py-0.5 rounded ${discountType === 'flat' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    {currency} Flat
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {discountType === 'percent' ? (
                  <div className="flex items-center gap-1 flex-1">
                    {[0, 5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPercent(pct)}
                        className={`flex-1 py-1 text-xs font-semibold rounded border transition ${
                          discountPercent === pct
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-slate-400 text-xs">{currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={discountFlat || ''}
                      onChange={(e) => setDiscountFlat(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {calculatedDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 text-xs">
                <span>Discount Applied</span>
                <span>-{currency}{calculatedDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400 text-xs">
              <span>Tax ({order.tax_percent}%)</span>
              <span className="text-slate-200">{currency}{calculatedTax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-700">
              <span>Grand Total</span>
              <span className="text-emerald-400 text-lg">{currency}{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Select Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'CARD', label: 'Card', icon: CreditCard },
                { id: 'MOBILE', label: 'Mobile/QR', icon: Smartphone },
                { id: 'SPLIT', label: 'Split', icon: Split }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id as any)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                    paymentMethod === id
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Handling with Quick Buttons */}
          {paymentMethod === 'CASH' && (
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Amount Tendered</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-medium">{currency}</span>
                <input
                  type="number"
                  step="0.01"
                  value={tenderedStr}
                  onChange={(e) => setTenderedStr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-lg font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickCash(grandTotal)}
                  className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-200 transition"
                >
                  Exact ({currency}{grandTotal.toFixed(2)})
                </button>
                {[10, 20, 50, 100].filter(amt => amt >= grandTotal).slice(0, 3).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-200 transition"
                  >
                    {currency}{amt}
                  </button>
                ))}
              </div>

              {/* Change Returned */}
              <div className="flex justify-between items-center p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Change Due:</span>
                <span className={`text-base font-extrabold ${changeDue > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {currency}{changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Optional Reference / Card Note */}
          {paymentMethod !== 'CASH' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Transaction / Card Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Auth Code #4920 or Txn ID"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-semibold text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitPayment}
            className="flex-2 flex items-center justify-center gap-2 py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Processing...' : `Complete Payment (${currency}${grandTotal.toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
};
