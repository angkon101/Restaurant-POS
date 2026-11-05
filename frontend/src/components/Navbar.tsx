import React, { useState, useEffect } from 'react';
import { Zap, LayoutGrid, ChefHat, BarChart3, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { Settings } from '../types';

export type NavTab = 'QUICK_POS' | 'FLOOR_POS' | 'KITCHEN' | 'REPORTS' | 'SETTINGS';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="h-14 sm:h-16 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between select-none no-print relative z-30">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center font-black shadow-inner">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 fill-emerald-400/20" />
        </div>
        <div>
          <h1 className="font-extrabold text-xs sm:text-sm text-white tracking-tight leading-none truncate max-w-[140px] sm:max-w-none">
            {settings?.name || 'Mini POS'}
          </h1>
          <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            v2 Quick POS
          </span>
        </div>
      </div>

      {/* Desktop/Tablet Navigation Bar */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => handleTabClick('QUICK_POS')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'QUICK_POS'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Quick Order (v2)
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('FLOOR_POS')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'FLOOR_POS'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Floor Map (v1)
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('KITCHEN')}
          className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'KITCHEN'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          Kitchen (KDS)
          {kotCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black animate-pulse">
              {kotCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('REPORTS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'REPORTS'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Daily Sales (Z)
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('SETTINGS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'SETTINGS'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          Settings
        </button>
      </nav>

      {/* Status Bar / Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="text-[10px] sm:text-xs text-slate-300 font-semibold hidden sm:inline">
            {isWsConnected ? 'Live Sync' : 'Connecting'}
          </span>
        </div>

        <span className="font-mono text-slate-300 font-semibold text-xs">{timeStr}</span>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-slate-900 border-b border-slate-800 p-3 space-y-1.5 shadow-2xl animate-in slide-in-from-top-2">
          <button
            type="button"
            onClick={() => handleTabClick('QUICK_POS')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition ${
              currentTab === 'QUICK_POS' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Quick Order (v2)
            </span>
            <span className="text-[10px] bg-slate-950/60 px-2 py-0.5 rounded text-emerald-300">Default</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('FLOOR_POS')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition ${
              currentTab === 'FLOOR_POS' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-400" />
              Floor Map (v1 Dine-In)
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('KITCHEN')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition ${
              currentTab === 'KITCHEN' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-amber-400" />
              Kitchen (KDS)
            </span>
            {kotCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                {kotCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('REPORTS')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition ${
              currentTab === 'REPORTS' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Daily Sales (Z-Report)
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('SETTINGS')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition ${
              currentTab === 'SETTINGS' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-slate-400" />
              Settings &amp; Menu Admin
            </span>
          </button>
        </div>
      )}
    </header>
  );
};
