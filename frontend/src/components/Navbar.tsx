import React, { useState, useEffect } from 'react';
import { Utensils, LayoutGrid, ChefHat, BarChart3, Settings as SettingsIcon, Wifi, WifiOff } from 'lucide-react';
import { Settings } from '../types';

interface NavbarProps {
  currentTab: 'POS' | 'KITCHEN' | 'REPORTS' | 'SETTINGS';
  onSelectTab: (tab: 'POS' | 'KITCHEN' | 'REPORTS' | 'SETTINGS') => void;
  settings: Settings;
  kotCount: number;
  isWsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  settings,
  kotCount,
  isWsConnected
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between select-none no-print">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center font-black shadow-inner">
          <Utensils className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm text-white tracking-tight leading-none">
            {settings?.name || 'Mini Bistro POS'}
          </h1>
          <span className="text-[10px] text-slate-400 font-medium">Dine-In & KOT Terminal</span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => onSelectTab('POS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            currentTab === 'POS'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Floor & POS
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('KITCHEN')}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            currentTab === 'KITCHEN'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          Kitchen (KDS)
          {kotCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black animate-pulse">
              {kotCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('REPORTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            currentTab === 'REPORTS'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Daily Sales (Z)
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('SETTINGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            currentTab === 'SETTINGS'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          Settings
        </button>
      </nav>

      {/* Status Bar */}
      <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
        {/* Live sync connection indicator */}
        <div className="flex items-center gap-1.5">
          {isWsConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] text-emerald-400 font-semibold">Live Sync</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-[11px] text-amber-400">Connecting...</span>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-slate-800"></div>

        {/* Live Clock */}
        <span className="font-mono text-slate-300 font-semibold">{timeStr}</span>
      </div>
    </header>
  );
};
