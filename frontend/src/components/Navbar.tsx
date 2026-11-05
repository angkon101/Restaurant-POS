import React, { useState, useEffect } from 'react';
import { Zap, BarChart3, Utensils } from 'lucide-react';
import { Settings } from '../types';

export type NavTab = 'POS' | 'REPORTS' | 'SETTINGS';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  settings: Settings;
  isWsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  settings,
  isWsConnected
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-6 flex items-center justify-between select-none no-print shadow-xs shrink-0 z-20">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-50 text-[#026cb6] border border-blue-200 rounded-xl flex items-center justify-center font-black shadow-xs">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#026cb6] fill-blue-500/20" />
        </div>
        <div>
          <h1 className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight leading-none truncate max-w-[110px] sm:max-w-none">
            {settings?.name || "Mijan's Restaurant"}
          </h1>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] sm:text-[10px] text-[#026cb6] font-bold uppercase tracking-wider">
              POS App
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold">
              {settings?.currency_symbol || '৳'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Fully visible and responsive on both Mobile & Desktop) */}
      <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/90 shadow-xs">
        <button
          type="button"
          onClick={() => onSelectTab('POS')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'POS'
              ? 'bg-[#026cb6] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span><span className="hidden sm:inline">Take </span>Order</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('REPORTS')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'REPORTS'
              ? 'bg-[#026cb6] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span><span className="hidden sm:inline">Daily </span>Sales</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('SETTINGS')}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'SETTINGS'
              ? 'bg-[#026cb6] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Menu<span className="hidden sm:inline"> Catalog</span></span>
        </button>
      </nav>

      {/* Right: Live Sync Status & Digital Time */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
          <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-[10px] font-semibold hidden md:inline">
            {isWsConnected ? 'Live' : 'Connecting'}
          </span>
        </div>

        <div className="hidden sm:block font-mono text-slate-700 font-bold text-xs bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/80">
          {timeStr}
        </div>
      </div>
    </header>
  );
};
