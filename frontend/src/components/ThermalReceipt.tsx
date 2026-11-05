import React from 'react';
import { Printer, X } from 'lucide-react';
import { Order, Settings, Payment } from '../types';

interface ThermalReceiptProps {
  order: Order;
  settings: Settings;
  payment?: Payment | null;
  paperSize?: '80mm' | '58mm';
  onClose?: () => void;
  autoPrint?: boolean;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  order,
  settings,
  payment,
  paperSize = '80mm',
  onClose,
  autoPrint = false
}) => {
  const currency = settings?.currency_symbol || '$';
  const is58mm = paperSize === '58mm';

  React.useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Container - on screen it displays a preview card, during @media print only receipt prints */}
      <div className="bg-white text-black rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col no-print">
        {/* Modal Controls */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 text-white border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-base">Receipt Preview ({paperSize})</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Receipt Screen Simulation */}
        <div className="p-6 bg-slate-100 flex justify-center max-h-[75vh] overflow-y-auto">
          <div className={`bg-white shadow-md border border-slate-200 p-4 font-mono text-xs ${is58mm ? 'w-[230px]' : 'w-[320px]'}`}>
            <ReceiptContent order={order} settings={settings} payment={payment} currency={currency} is58mm={is58mm} />
          </div>
        </div>
      </div>

      {/* Actual Print Element for Browser Print Driver */}
      <div className={`print-only ${is58mm ? 'receipt-58mm' : 'receipt-80mm'} font-mono text-black bg-white`}>
        <ReceiptContent order={order} settings={settings} payment={payment} currency={currency} is58mm={is58mm} />
      </div>
    </div>
  );
};

interface ContentProps {
  order: Order;
  settings: Settings;
  payment?: Payment | null;
  currency: string;
  is58mm: boolean;
}

const ReceiptContent: React.FC<ContentProps> = ({ order, settings, payment, currency, is58mm }) => {
  const formattedDate = new Date(order.created_at || Date.now()).toLocaleString();

  return (
    <div className="text-center">
      {/* Header */}
      <h2 className="font-bold text-sm tracking-wide uppercase">{settings?.name || 'MINI RESTAURANT POS'}</h2>
      {settings?.tagline && <p className="text-[10px] text-gray-600">{settings.tagline}</p>}
      <p className="text-[10px] text-gray-600">{settings?.address}</p>
      <p className="text-[10px] text-gray-600">Tel: {settings?.phone}</p>
      
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Meta Info */}
      <div className="text-[11px] text-left space-y-0.5">
        <div className="flex justify-between">
          <span>Bill No:</span>
          <span className="font-bold">{order.order_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span>Order Type:</span>
          <span className="font-bold">{order.order_type}</span>
        </div>
        {order.table_id && (
          <div className="flex justify-between">
            <span>Table:</span>
            <span className="font-bold text-xs">{order.table_id ? `Table #${order.table_id}` : 'Counter'}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Server:</span>
          <span>{order.waiter_name || 'Staff'}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Item List */}
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Price</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-100">
              <td className="py-1 pr-1">
                <div className="font-medium">{item.item_name}</div>
                {item.notes && <div className="text-[9px] text-gray-500 italic">*{item.notes}</div>}
              </td>
              <td className="py-1 text-center align-top">{item.quantity}</td>
              <td className="py-1 text-right align-top">{currency}{item.unit_price.toFixed(2)}</td>
              <td className="py-1 text-right align-top font-semibold">{currency}{item.total_price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Calculations */}
      <div className="text-[11px] space-y-1 text-right">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{currency}{order.subtotal.toFixed(2)}</span>
        </div>
        {order.discount_amount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount ({order.discount_percent > 0 ? `${order.discount_percent}%` : 'Flat'}):</span>
            <span>-{currency}{order.discount_amount.toFixed(2)}</span>
          </div>
        )}
        {order.tax_amount > 0 && (
          <div className="flex justify-between">
            <span>Tax ({order.tax_percent}%):</span>
            <span>{currency}{order.tax_amount.toFixed(2)}</span>
          </div>
        )}
        {order.service_charge > 0 && (
          <div className="flex justify-between">
            <span>Service Charge:</span>
            <span>{currency}{order.service_charge.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold border-t border-gray-400 pt-1 mt-1">
          <span>TOTAL:</span>
          <span>{currency}{order.total_amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Information */}
      {payment && (
        <>
          <div className="border-t border-dashed border-gray-400 my-2"></div>
          <div className="text-[11px] text-left space-y-0.5">
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="font-bold">{payment.payment_method}</span>
            </div>
            {payment.amount_tendered > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Tendered:</span>
                  <span>{currency}{payment.amount_tendered.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Change:</span>
                  <span>{currency}{payment.change_returned.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="border-t border-dashed border-gray-400 my-3"></div>
      <p className="text-[10px] text-gray-700 font-medium">{settings?.receipt_footer || 'Thank you for your visit!'}</p>
      <p className="text-[9px] text-gray-400 mt-1">Powered by Mini Restaurant POS</p>
    </div>
  );
};

