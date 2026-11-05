import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, Flame, Printer, Bell, BellOff, Volume2, Maximize2 } from 'lucide-react';
import { KOT } from '../types';
import { api } from '../services/api';
import { sound } from '../services/sound';
import { KOTTicket } from '../components/KOTTicket';

interface KitchenPageProps {
  paperSize: '80mm' | '58mm';
}

export const KitchenPage: React.FC<KitchenPageProps> = ({ paperSize }) => {
  const [kots, setKots] = useState<KOT[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedKOTForPrint, setSelectedKOTForPrint] = useState<KOT | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NEW' | 'IN_PROGRESS'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchKots = async () => {
    try {
      const data = await api.getKOTs(true);
      setKots(data);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKots();
    const interval = setInterval(fetchKots, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (kotId: number, nextStatus: string) => {
    try {
      await api.updateKOTStatus(kotId, nextStatus);
      fetchKots();
    } catch (err) {
      alert((err as Error).message || 'Failed to update status');
    }
  };

  const getElapsedTimeMinutes = (createdStr: string) => {
    return Math.floor((Date.now() - new Date(createdStr).getTime()) / 60000);
  };

  const filteredKots = kots.filter(k => {
    if (filterStatus === 'ALL') return true;
    return k.status === filterStatus;
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Kitchen Bar */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-white">Kitchen Display System (KDS)</h2>
            <p className="text-xs text-slate-400">
              {kots.length} active {kots.length === 1 ? 'ticket' : 'tickets'} waiting in kitchen
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${filterStatus === 'ALL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
            >
              All ({kots.length})
            </button>
            <button
              onClick={() => setFilterStatus('NEW')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${filterStatus === 'NEW' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
            >
              New ({kots.filter(k => k.status === 'NEW').length})
            </button>
            <button
              onClick={() => setFilterStatus('IN_PROGRESS')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${filterStatus === 'IN_PROGRESS' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
            >
              Cooking ({kots.filter(k => k.status === 'IN_PROGRESS').length})
            </button>
          </div>

          {/* Sound Toggle & Bell Test */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition ${soundEnabled ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            title={soundEnabled ? 'Kitchen Bell Enabled' : 'Kitchen Bell Muted'}
          >
            {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => sound.playKitchenBell()}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition"
            title="Test Kitchen Chime"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-500">
            Loading kitchen tickets...
          </div>
        ) : filteredKots.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <ChefHat className="w-12 h-12 mb-3 stroke-1 text-slate-600" />
            <p className="text-base font-semibold text-slate-400">All caught up!</p>
            <p className="text-xs text-slate-500 mt-1">No pending orders in the kitchen queue right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredKots.map((kot) => {
              const elapsedMins = getElapsedTimeMinutes(kot.created_at);
              const isUrgent = elapsedMins >= 15;
              const isMedium = elapsedMins >= 8 && elapsedMins < 15;

              return (
                <div
                  key={kot.id}
                  className={`flex flex-col justify-between bg-slate-900 rounded-2xl border-2 overflow-hidden shadow-xl transition ${
                    isUrgent
                      ? 'border-red-500/80 shadow-red-950/30'
                      : isMedium
                      ? 'border-amber-500/80 shadow-amber-950/30'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className={`p-4 border-b ${
                    isUrgent
                      ? 'bg-red-950/40 border-red-900/50'
                      : isMedium
                      ? 'bg-amber-950/40 border-amber-900/50'
                      : 'bg-slate-800/60 border-slate-800'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{kot.kot_number}</span>
                        <h3 className="font-black text-xl text-white tracking-tight">
                          {kot.table_number || 'Takeaway'}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-slate-950/80 border border-slate-700 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-lg">
                          Round #{kot.round_number}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mt-1 justify-end">
                          <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-400' : isMedium ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span className={isUrgent ? 'text-red-400 font-bold' : isMedium ? 'text-amber-400' : ''}>
                            {elapsedMins < 1 ? 'Just now' : `${elapsedMins} min`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
                      <span>Server: {kot.waiter_name || 'Staff'}</span>
                      <button
                        onClick={() => setSelectedKOTForPrint(kot)}
                        className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                        title="Print Ticket"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="p-4 flex-1 space-y-2.5 overflow-y-auto max-h-72">
                    {kot.items.map((item, idx) => (
                      <div key={idx} className="pb-2 border-b border-slate-800/80 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-black text-amber-400 bg-amber-950/50 border border-amber-800/40 px-1.5 py-0.5 rounded">
                              {item.quantity}x
                            </span>
                            <span className="text-sm font-bold text-slate-100 leading-snug">
                              {item.item_name}
                            </span>
                          </div>
                        </div>
                        {item.notes && (
                          <div className="text-xs font-bold text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg p-1.5 mt-1.5">
                            ⚠️ NOTE: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex gap-2">
                    {kot.status === 'NEW' && (
                      <button
                        onClick={() => handleUpdateStatus(kot.id, 'IN_PROGRESS')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-md"
                      >
                        <Flame className="w-4 h-4" />
                        Start Cooking
                      </button>
                    )}
                    {kot.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStatus(kot.id, 'READY')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Ready
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(kot.id, 'COMPLETED')}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-xs transition border border-slate-700"
                      title="Clear Ticket / Served"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KOT Print Modal */}
      {selectedKOTForPrint && (
        <KOTTicket
          kot={selectedKOTForPrint}
          paperSize={paperSize}
          onClose={() => setSelectedKOTForPrint(null)}
        />
      )}
    </div>
  );
};

