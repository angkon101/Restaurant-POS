import React, { useState } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import { Table } from '../types';
import { api } from '../services/api';

interface TransferTableModalProps {
  sourceTable: Table;
  tables: Table[];
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferTableModal: React.FC<TransferTableModalProps> = ({
  sourceTable,
  tables,
  onClose,
  onSuccess
}) => {
  const availableTables = tables.filter(t => t.id !== sourceTable.id && t.status === 'AVAILABLE');
  const [targetId, setTargetId] = useState<number | null>(availableTables[0]?.id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTransfer = async () => {
    if (!targetId) {
      setErrorMsg('Please select a destination table');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await api.transferTable(sourceTable.id, targetId);
      onSuccess();
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMsg((err as Error).message || 'Failed to transfer table');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white">Transfer Table Order</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-between p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div>
              <span className="text-xs text-slate-400 block">Current Table:</span>
              <span className="font-bold text-white text-base">{sourceTable.number}</span>
              <span className="text-xs text-slate-400 ml-2">({sourceTable.name})</span>
            </div>
            <ArrowRightLeft className="w-5 h-5 text-slate-500" />
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Destination:</span>
              <span className="font-bold text-emerald-400 text-base">
                {tables.find(t => t.id === targetId)?.number || 'Select below'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Available Table</label>
            {availableTables.length === 0 ? (
              <p className="text-sm text-amber-400 bg-amber-950/30 border border-amber-800/50 p-3 rounded-xl">
                No other tables are currently available to transfer into.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableTables.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTargetId(t.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      targetId === t.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-bold text-sm">{t.number}</div>
                    <div className="text-xs text-slate-400">{t.name} • {t.capacity} Seats</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

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
            disabled={isSubmitting || !targetId}
            onClick={handleTransfer}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/30 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
};

