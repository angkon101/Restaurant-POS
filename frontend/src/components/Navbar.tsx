import React, { useState, useEffect } from 'react';
import { 
  Zap, BarChart3, Utensils, Menu, ArrowLeft, Smartphone, Monitor
} from 'lucide-react';
import { Settings } from '../types';
import { haptics } from '../services/haptics';

export type NavTab = 'POS' | 'REPORTS' | 'SETTINGS';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  settings: Settings;
  isWsConnected: boolean;
  isMobileView?: boolean;
  tableNumber?: string;
  onOpenDrawer?: () => void;
  onOpenTableModal?: () => void;
  onToggleViewMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  settings,
  isWsConnected,
  isMobileView = false,
  tableNumber = '1',
  onOpenDrawer,
  onOpenTableModal,
  onToggleViewMode
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

  // =========================================================================
  // 1. MOBILE APP BAR (Matches user's exact mobile mockup: bg-[#084c94])
  // =========================================================================
  if (isMobileView) {
    return (
      <header className="h-14 bg-[#084c94] text-white px-3 flex items-center justify-between select-none shadow-md shrink-0 z-30 pt-[env(safe-area-inset-top)]">
        {/* Left: Drawer Hamburger or Back Arrow */}
        <div className="flex items-center gap-1">
          {currentTab === 'POS' ? (
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                onOpenDrawer?.();
              }}
              className="p-2 -ml-1 rounded-xl hover:bg-white/15 active:bg-white/25 transition text-white"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                onSelectTab('POS');
              }}
              className="p-2 -ml-1 rounded-xl hover:bg-white/15 active:bg-white/25 transition text-white flex items-center gap-1"
              title="Back to Order Terminal"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              <span className="text-xs font-bold">POS</span>
            </button>
          )}
        </div>

        {/* Center: Title */}
        <div className="text-center">
          <h1 className="text-base sm:text-lg font-black text-white tracking-wide leading-tight">
            {currentTab === 'POS' ? 'Order' : currentTab === 'REPORTS' ? 'Daily Sales' : 'Menu Catalog'}
          </h1>
        </div>

        {/* Right: Table Selection Pill (or View Switcher) */}
        <div className="flex items-center gap-1.5">
          {currentTab === 'POS' && (
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                onOpenTableModal?.();
              }}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/35 transition text-right leading-tight"
              title="Change Table"
            >
              <span className="block text-[10px] text-blue-200 font-semibold">Table No.</span>
              <span className="block text-xs font-black text-white truncate max-w-[70px]">
                {tableNumber.toLowerCase().includes('takeaway') ? 'Takeaway' : tableNumber}
              </span>
            </button>
          )}

          {/* Desktop/Mobile Mode Toggle (for testing on PC/Laptop) */}
          {onToggleViewMode && (
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                onToggleViewMode();
              }}
              className="hidden lg:flex p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
              title="Switch to Desktop Mode"
            >
              <Monitor className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>
    );
  }

  // =========================================================================
  // 2. DESKTOP APP BAR (Full-width clean light mode for PC / Laptop)
  // =========================================================================
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between select-none no-print shadow-xs shrink-0 z-20">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-9 h-9 bg-blue-50 text-[#026cb6] border border-blue-200 rounded-xl flex items-center justify-center font-black shadow-xs">
          <Zap className="w-5 h-5 text-[#026cb6] fill-blue-500/20" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm text-slate-900 tracking-tight leading-none">
            {settings?.name || "Mijan's Restaurant"}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-[#026cb6] font-bold uppercase tracking-wider">
              Desktop POS
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] text-slate-500 font-bold">
              {settings?.currency_symbol || '৳'} BDT
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/90 shadow-xs">
        <button
          type="button"
          onClick={() => onSelectTab('POS')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'POS'
              ? 'bg-[#026cb6] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Take Order</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('REPORTS')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'REPORTS'
              ? 'bg-[#026cb6] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Daily Sales</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('SETTINGS')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            currentTab === 'SETTINGS'
              ? 'bg-[#026cb6] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Menu Catalog</span>
        </button>
      </nav>

      {/* Right Controls: View Switcher, Live Sync Status & Digital Time */}
      <div className="flex items-center gap-3 shrink-0">
        {onToggleViewMode && (
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              onToggleViewMode();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#026cb6] hover:bg-blue-100 text-xs font-bold transition"
            title="Preview Mobile App Mode"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile App View</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
          <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-[11px] font-semibold">
            {isWsConnected ? 'Cloud Sync' : 'Offline'}
          </span>
        </div>

        <div className="font-mono text-xs font-bold text-slate-500">
          {timeStr}
        </div>
      </div>
    </header>
  );
};
