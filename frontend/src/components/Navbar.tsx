import React, { useState, useEffect } from 'react';
import { Zap, BarChart3, Utensils, Menu, X } from 'lucide-react';
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
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between select-none no-print relative z-30 shadow-xs">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 text-[#026cb6] border border-blue-200 rounded-xl flex items-center justify-center font-black shadow-xs">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#026cb6] fill-blue-500/20" />
        </div>
        <div>
          <h1 className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight leading-none truncate max-w-[150px] sm:max-w-none">
            {settings?.name || "Mijan's Restaurant"}
          </h1>
          <span className="text-[9px] sm:text-[10px] text-[#026cb6] font-bold uppercase tracking-wider">
            Quick Counter POS
          </span>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => handleTabClick('POS')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'POS'
              ? 'bg-[#026cb6] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
              ? 'bg-[#026cb6] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
              ? 'bg-[#026cb6] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          Menu Catalog
        </button>
      </nav>

      {/* Status Bar / Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span className="text-[10px] sm:text-xs text-slate-600 font-semibold hidden sm:inline">
            {isWsConnected ? 'Live' : 'Connecting'}
          </span>
        </div>

        <span className="font-mono text-slate-700 font-bold text-xs">{timeStr}</span>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-white border-b border-slate-200 p-3 space-y-1.5 shadow-xl animate-in slide-in-from-top-2">
          <button
            type="button"
            onClick={() => handleTabClick('POS')}
            className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition ${
              currentTab === 'POS' ? 'bg-[#026cb6] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-500" />
            Take Order
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('REPORTS')}
            className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition ${
              currentTab === 'REPORTS' ? 'bg-[#026cb6] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Daily Sales (Z-Report)
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('SETTINGS')}
            className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition ${
              currentTab === 'SETTINGS' ? 'bg-[#026cb6] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-500" />
            Menu Catalog Admin
          </button>
        </div>
      )}
    </header>
  );
};
