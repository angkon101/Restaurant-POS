import React from 'react';
import { CheckCircle2, Printer, Plus, ShoppingBag, Utensils } from 'lucide-react';
import { Order, Payment, Settings } from '../../types';

interface OrderSuccessModalProps {
  order: Order;
  payment: Payment;
  settings: Settings;
  onPrintReceipt: () => void;
  onNewOrder: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  payment,
  settings,
  onPrintReceipt,
  onNewOrder
}) => {
  const currency = settings?.currency_symbol || '$';
  const tokenNumber = order.order_number.slice(-3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 no-print animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Animated Success Badge */}
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40 animate-bounce">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Order Confirmed &amp; Paid
          </span>
          <div className="text-3xl font-black text-white">
            Token #{tokenNumber}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">{order.order_number}</p>
        </div>

        {/* Order Details Mini Card */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs text-left">
          <div className="flex justify-between text-slate-400">
            <span>Customer:</span>
            <span className="text-white font-semibold">{order.customer_name || 'Walk-in'}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Order Type:</span>
            <span className="text-emerald-400 font-bold">{order.order_type}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Payment Mode:</span>
            <span className="text-white font-semibold">{payment.payment_method}</span>
          </div>
          {payment.change_returned > 0 && (
            <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-slate-800">
              <span>Change Returned:</span>
              <span>{currency}{payment.change_returned.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800">
            <span>Total Paid:</span>
            <span className="text-emerald-400">{currency}{order.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onPrintReceipt}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded-2xl text-xs font-bold border border-slate-700 transition"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Print Receipt ({settings?.printer_paper_size || '80mm'})
          </button>

          <button
            type="button"
            onClick={onNewOrder}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-emerald-950/40 transition"
          >
            <Plus className="w-4 h-4" />
            Start Next Order
          </button>
        </div>
      </div>
    </div>
  );
};

