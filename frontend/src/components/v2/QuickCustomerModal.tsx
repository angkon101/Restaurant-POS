import React, { useState } from 'react';
import { X, User, Phone } from 'lucide-react';
import { haptics } from '../../services/haptics';

interface QuickCustomerModalProps {
  isOpen: boolean;
  customerName: string;
  customerPhone: string;
  onSave: (name: string, phone: string) => void;
  onClose: () => void;
}

export const QuickCustomerModal: React.FC<QuickCustomerModalProps> = ({
  isOpen,
  customerName,
  customerPhone,
  onSave,
  onClose
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    haptics.tap();
    onSave(name.trim(), phone.trim());
    onClose();
  };

  const handleClear = () => {
    haptics.tap();
    setName('');
    setPhone('');
    onSave('', '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-[#084c94] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight text-white">Customer Details</h3>
              <p className="text-[11px] text-blue-100">Optional for receipt & tracking</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Customer Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahim Chowdhury"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#026cb6]"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +880 1712-345678"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#026cb6]"
              />
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="pt-1 flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                setName('Walk-in Customer');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition"
            >
              Walk-in Guest
            </button>
            <button
              type="button"
              onClick={() => {
                setName('Regular VIP');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition"
            >
              Regular VIP
            </button>
          </div>

          {/* Actions */}
          <div className="pt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition active:scale-95"
            >
              Clear
            </button>
            <button
              type="submit"
              className="col-span-2 py-2.5 rounded-xl text-xs font-extrabold bg-[#026cb6] hover:bg-[#084c94] text-white shadow-xs transition active:scale-95"
            >
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
