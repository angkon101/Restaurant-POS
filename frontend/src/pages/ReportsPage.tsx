import React, { useState, useEffect } from 'react';
import { DollarSign, Receipt, TrendingUp, CreditCard, Banknote, Smartphone, Printer, RefreshCw, Calendar } from 'lucide-react';
import { TodayReport, Settings } from '../types';
import { api } from '../services/api';

interface ReportsPageProps {
  settings: Settings;
  paperSize: '80mm' | '58mm';
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ settings, paperSize }) => {
  const currency = settings?.currency_symbol || '$';
  const [report, setReport] = useState<TodayReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrintingZReport, setIsPrintingZReport] = useState(false);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTodayReport();
      setReport(data);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePrintZReport = () => {
    setIsPrintingZReport(true);
    setTimeout(() => {
      window.print();
      setIsPrintingZReport(false);
    }, 300);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 no-print">
        <div>
          <h2 className="text-xl font-black text-white">Daily Sales & Reconciliation (Z-Report)</h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Date: {report?.date || new Date().toISOString().split('T')[0]}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handlePrintZReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/40"
          >
            <Printer className="w-4 h-4" />
            Print Z-Report ({paperSize})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          Generating daily sales analytics...
        </div>
      ) : report ? (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white">{currency}{report.total_sales.toFixed(2)}</h3>
              <p className="text-[11px] text-slate-500 mt-1">Tax collected: {currency}{report.total_tax.toFixed(2)}</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Completed Orders</span>
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white">{report.total_orders}</h3>
              <p className="text-[11px] text-slate-500 mt-1">Discounts given: {currency}{report.total_discount.toFixed(2)}</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Average Check</span>
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white">{currency}{report.average_check.toFixed(2)}</h3>
              <p className="text-[11px] text-slate-500 mt-1">Per dining check</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Cash vs Digital</span>
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white">
                {currency}{(report.payment_breakdown.CASH || 0).toFixed(2)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Card/Mobile: {currency}{((report.payment_breakdown.CARD || 0) + (report.payment_breakdown.MOBILE || 0)).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Two Column Layout: Payment Methods & Top Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
            {/* Payment Method Breakdown */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-bold text-base text-white">Payment Method Breakdown</h4>
              <div className="space-y-3">
                {[
                  { label: 'Cash in Drawer', key: 'CASH', icon: Banknote, color: 'text-emerald-400' },
                  { label: 'Credit / Debit Card', key: 'CARD', icon: CreditCard, color: 'text-indigo-400' },
                  { label: 'Mobile Wallets / QR', key: 'MOBILE', icon: Smartphone, color: 'text-amber-400' },
                  { label: 'Split Payments', key: 'SPLIT', icon: Receipt, color: 'text-purple-400' },
                ].map(({ label, key, icon: Icon, color }) => {
                  const amt = report.payment_breakdown[key] || 0;
                  const pct = report.total_sales > 0 ? (amt / report.total_sales) * 100 : 0;
                  return (
                    <div key={key} className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${color}`} />
                          <span className="text-xs font-semibold text-slate-300">{label}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{currency}{amt.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Selling Items */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-bold text-base text-white">Top Selling Items Today</h4>
              {report.top_items.length === 0 ? (
                <p className="text-xs text-slate-500">No items sold yet today.</p>
              ) : (
                <div className="space-y-2.5">
                  {report.top_items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-500 w-4">#{idx + 1}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{item.item_name}</p>
                          <span className="text-[11px] text-slate-400">{item.quantity} sold</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">
                        {currency}{item.revenue.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Printable Z-Report for Thermal Printer */}
          <div className="print-only receipt-80mm font-mono text-black bg-white p-2">
            <div className="text-center">
              <h2 className="font-bold text-sm uppercase">{settings?.name || 'MINI RESTAURANT'}</h2>
              <p className="text-[10px]">DAILY SALES RECONCILIATION (Z-REPORT)</p>
              <div className="border-t border-dashed border-black my-2"></div>
              <div className="text-[11px] text-left space-y-0.5">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{report.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Generated:</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="border-t border-dashed border-black my-2"></div>
              <div className="text-[11px] text-left space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Total Sales:</span>
                  <span>{currency}{report.total_sales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span>{currency}{report.total_tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Discounts:</span>
                  <span>{currency}{report.total_discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Orders:</span>
                  <span>{report.total_orders}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Check:</span>
                  <span>{currency}{report.average_check.toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-dashed border-black my-2"></div>
              <div className="text-[11px] text-left space-y-1 font-bold">
                <div>PAYMENT BREAKDOWN:</div>
                <div className="flex justify-between font-normal">
                  <span>Cash:</span>
                  <span>{currency}{(report.payment_breakdown.CASH || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-normal">
                  <span>Card:</span>
                  <span>{currency}{(report.payment_breakdown.CARD || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-normal">
                  <span>Mobile/QR:</span>
                  <span>{currency}{(report.payment_breakdown.MOBILE || 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-dashed border-black my-3"></div>
              <p className="text-[10px] text-center font-bold">-- END OF SHIFT REPORT --</p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

