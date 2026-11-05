import React from 'react';
import { Users, Clock, DollarSign, ArrowRightLeft, Receipt } from 'lucide-react';
import { Table, Order } from '../types';

interface TableCardProps {
  table: Table;
  activeOrder?: Order | null;
  currencySymbol: string;
  onSelect: (table: Table) => void;
  onPay: (table: Table, order: Order) => void;
  onTransfer: (table: Table) => void;
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  activeOrder,
  currencySymbol,
  onSelect,
  onPay,
  onTransfer
}) => {
  const isOccupied = table.status === 'OCCUPIED' && activeOrder;
  const isBilled = table.status === 'BILLED';

  const getStatusStyles = () => {
    switch (table.status) {
      case 'OCCUPIED':
        return 'border-amber-500/60 bg-amber-950/20 shadow-amber-950/20';
      case 'BILLED':
        return 'border-purple-500/60 bg-purple-950/20 shadow-purple-950/20';
      case 'RESERVED':
        return 'border-blue-500/60 bg-blue-950/20 shadow-blue-950/20';
      default:
        return 'border-slate-800 bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-800/80';
    }
  };

  const getBadgeColor = () => {
    switch (table.status) {
      case 'OCCUPIED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'BILLED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'RESERVED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const getOrderElapsed = () => {
    if (!activeOrder?.created_at) return '';
    const diffMins = Math.floor((Date.now() - new Date(activeOrder.created_at).getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div
      onClick={() => onSelect(table)}
      className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl ${getStatusStyles()}`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-extrabold text-lg text-white tracking-tight">{table.number}</h3>
            <p className="text-xs text-slate-400 font-medium truncate max-w-[120px]">{table.name}</p>
          </div>
          <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${getBadgeColor()}`}>
            {table.status}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{table.capacity}</span>
          </div>
          <span className="text-slate-600">•</span>
          <span className="truncate">{table.section}</span>
        </div>
      </div>

      {/* Middle: Active Order Info (if occupied) */}
      {isOccupied ? (
        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-700/60 mb-3">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{getOrderElapsed()}</span>
            </div>
            <span className="text-[11px] text-slate-300 font-medium">
              {activeOrder.items?.length || 0} items
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-400 font-medium">Total:</span>
            <span className="text-sm font-black text-amber-300">
              {currencySymbol}{activeOrder.total_amount?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center">
          <span className="text-xs text-slate-500 font-medium">Ready for guests</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-700/40" onClick={(e) => e.stopPropagation()}>
        {isOccupied ? (
          <>
            <button
              type="button"
              onClick={() => onSelect(table)}
              className="flex-1 py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold transition border border-amber-500/30 text-center"
            >
              + Order
            </button>
            <button
              type="button"
              onClick={() => onPay(table, activeOrder)}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
              title="Pay & Settle Bill"
            >
              <Receipt className="w-3.5 h-3.5" />
              Pay
            </button>
            <button
              type="button"
              onClick={() => onTransfer(table)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition border border-slate-700"
              title="Transfer Table"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onSelect(table)}
            className="w-full py-2 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 rounded-lg text-xs font-bold transition border border-slate-700 hover:border-emerald-500 text-center"
          >
            Open Order
          </button>
        )}
      </div>
    </div>
  );
};
