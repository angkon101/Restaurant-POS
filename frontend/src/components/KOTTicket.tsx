import React from 'react';
import { Printer, X, ChefHat } from 'lucide-react';
import { KOT } from '../types';

interface KOTTicketProps {
  kot: KOT;
  paperSize?: '80mm' | '58mm';
  onClose?: () => void;
  autoPrint?: boolean;
}

export const KOTTicket: React.FC<KOTTicketProps> = ({
  kot,
  paperSize = '80mm',
  onClose,
  autoPrint = false
}) => {
  const is58mm = paperSize === '58mm';

  React.useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white text-black rounded-xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col no-print">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-sm">Kitchen Ticket ({kot.kot_number})</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded text-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print KOT
            </button>
            {onClose && (
              <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="p-5 bg-slate-100 flex justify-center">
          <div className={`bg-white shadow p-4 font-mono text-xs ${is58mm ? 'w-[230px]' : 'w-[290px]'}`}>
            <KOTContent kot={kot} />
          </div>
        </div>
      </div>

      {/* Actual Print Element */}
      <div className={`print-only ${is58mm ? 'receipt-58mm' : 'receipt-80mm'} font-mono text-black bg-white`}>
        <KOTContent kot={kot} />
      </div>
    </div>
  );
};

const KOTContent: React.FC<{ kot: KOT }> = ({ kot }) => {
  const dateStr = new Date(kot.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="text-left">
      <div className="text-center font-bold text-sm tracking-wider uppercase border-b-2 border-dashed border-black pb-1 mb-2">
        *** KITCHEN ORDER TICKET ***
      </div>

      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-bold">KOT: {kot.kot_number}</span>
        <span className="text-[11px] font-bold bg-black text-white px-1.5 py-0.5 rounded">
          ROUND #{kot.round_number}
        </span>
      </div>

      <div className="text-base font-black my-1 border-y border-black py-1">
        TABLE: {kot.table_number || 'COUNTER / TAKEAWAY'}
      </div>

      <div className="text-[11px] flex justify-between text-gray-700 mb-2">
        <span>Server: {kot.waiter_name || 'Staff'}</span>
        <span>Time: {dateStr}</span>
      </div>

      <div className="border-t-2 border-black my-1"></div>

      {/* Items */}
      <div className="space-y-2 my-2">
        {kot.items.map((item, idx) => (
          <div key={idx} className="flex items-start justify-between border-b border-dashed border-gray-300 pb-1.5">
            <div className="flex-1">
              <span className="font-extrabold text-sm mr-2">{item.quantity}x</span>
              <span className="font-bold text-xs">{item.item_name}</span>
              {item.notes && (
                <div className="text-[11px] font-semibold text-red-600 pl-6 mt-0.5">
                  &gt;&gt; NOTE: {item.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-black my-2"></div>
      <div className="text-center text-[10px] uppercase tracking-wider text-gray-600 font-bold">
        -- END OF TICKET --
      </div>
    </div>
  );
};
