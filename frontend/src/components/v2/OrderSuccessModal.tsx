import React from 'react';
import { CheckCircle2, Printer, Plus } from 'lucide-react';
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
  const currency = settings?.currency_symbol || '৳';
  const tokenNumber = order.order_number.slice(-3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print animate-in fade-in">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Animated Success Badge */}
        <div className="w-16 h-16 bg-blue-50 text-[#026cb6] border-2 border-[#026cb6] rounded-full flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">
            Order Confirmed &amp; Paid
          </span>
          <div className="text-3xl font-black text-slate-900">
            Token #{tokenNumber}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">{order.order_number}</p>
        </div>

        {/* Order Details Mini Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-left">
          <div className="flex justify-between text-slate-600">
            <span>Customer:</span>
            <span className="text-slate-900 font-semibold">{order.customer_name || 'Walk-in'}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Order Type:</span>
            <span className="text-[#026cb6] font-bold">{order.order_type}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Payment Mode:</span>
            <span className="text-slate-900 font-semibold">{payment.payment_method}</span>
          </div>
          {payment.change_returned > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold pt-1 border-t border-slate-200">
              <span>Change Returned:</span>
              <span>{currency}{payment.change_returned.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
            <span>Total Paid:</span>
            <span className="text-[#026cb6]">{currency}{order.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onPrintReceipt}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold border border-slate-300 transition shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#026cb6]" />
            Print Receipt ({settings?.printer_paper_size || '80mm'})
          </button>

          <button
            type="button"
            onClick={onNewOrder}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-2xl text-sm font-extrabold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Start Next Order
          </button>
        </div>
      </div>
    </div>
  );
};
