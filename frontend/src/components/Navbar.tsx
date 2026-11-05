import React, { useState, useEffect } from 'react';
import { Zap, BarChart3, Settings as SettingsIcon, Menu, X } from 'lucide-react';
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
          <h1 className="font-extrabold text-xs sm:text-sm text-white tracking-tight leading-none truncate max-w-[150px] sm:max-w-none">
            {settings?.name || 'Mini POS'}
          </h1>
          <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            Quick Counter POS
          </span>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => handleTabClick('POS')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'POS'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Take Order
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('REPORTS')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
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
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'SETTINGS'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          Settings &amp; Menu
        </button>
      </nav>

      {/* Status Bar / Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="text-[10px] sm:text-xs text-slate-300 font-semibold hidden sm:inline">
            {isWsConnected ? 'Live' : 'Connecting'}
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
            onClick={() => handleTabClick('POS')}
            className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition ${
              currentTab === 'POS' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            Take Order
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('REPORTS')}
            className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition ${
              currentTab === 'REPORTS' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Daily Sales (Z-Report)
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('SETTINGS')}
            className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition ${
              currentTab === 'SETTINGS' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <SettingsIcon className="w-4 h-4 text-slate-400" />
            Settings &amp; Menu Catalog
          </button>
        </div>
      )}
    </header>
  );
};
