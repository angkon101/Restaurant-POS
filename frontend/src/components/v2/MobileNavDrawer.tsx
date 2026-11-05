import React from 'react';
import { X, Zap, BarChart3, Utensils, Wifi, WifiOff, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { NavTab } from '../Navbar';
import { Settings } from '../../types';

interface MobileNavDrawerProps {
  isOpen: boolean;
  currentTab: NavTab;
  settings: Settings;
  isWsConnected: boolean;
  onSelectTab: (tab: NavTab) => void;
  onClose: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  currentTab,
  settings,
  isWsConnected,
  onSelectTab,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer Container (Slides from Left) */}
      <div className="relative w-4/5 max-w-xs bg-white text-slate-800 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
        
        {/* Top Header */}
        <div className="p-5 bg-[#026cb6] text-white flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-xs rounded-xl flex items-center justify-center font-black">
              <Zap className="w-6 h-6 text-white fill-white/20" />
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-xl transition text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h2 className="font-extrabold text-base leading-tight tracking-tight text-white">
              {settings?.name || "Mijan's Restaurant"}
            </h2>
            <p className="text-[11px] text-blue-100 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{settings?.address || 'Dhaka, Bangladesh'}</span>
            </p>
          </div>

          {/* Online Sync Pill */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/20 rounded-full text-[10px] font-semibold text-white w-fit">
            <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isWsConnected ? 'Live Cloud Sync' : 'Offline Mode'}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectTab('POS');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${
              currentTab === 'POS'
                ? 'bg-blue-50 text-[#026cb6] font-extrabold shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${currentTab === 'POS' ? 'bg-[#026cb6] text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="leading-tight">Order Terminal (POS)</p>
              <span className="text-[10px] text-slate-400 font-normal">Fast handheld mobile ordering</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('REPORTS');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${
              currentTab === 'REPORTS'
                ? 'bg-blue-50 text-[#026cb6] font-extrabold shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${currentTab === 'REPORTS' ? 'bg-[#026cb6] text-white' : 'bg-slate-100 text-slate-500'}`}>
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <p className="leading-tight">Daily Sales (Z-Report)</p>
              <span className="text-[10px] text-slate-400 font-normal">Reconciliation &amp; shift revenue</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('SETTINGS');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${
              currentTab === 'SETTINGS'
                ? 'bg-blue-50 text-[#026cb6] font-extrabold shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${currentTab === 'SETTINGS' ? 'bg-[#026cb6] text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <p className="leading-tight">Menu Catalog</p>
              <span className="text-[10px] text-slate-400 font-normal">Food items, pricing &amp; stock</span>
            </div>
          </button>

          {/* Quick Terminal Information */}
          <div className="pt-4 px-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Currency:</span>
                <span className="font-bold text-slate-800">Bangladeshi Taka ({settings?.currency_symbol || '৳'})</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>VAT / Tax:</span>
                <span className="font-bold text-slate-800">{settings?.tax_percentage || 5.0}%</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Printer Paper:</span>
                <span className="font-bold text-slate-800">{settings?.printer_paper_size || '80mm'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            Version 2.0 • Mobile Quick POS
          </p>
        </div>
      </div>
    </div>
  );
};

