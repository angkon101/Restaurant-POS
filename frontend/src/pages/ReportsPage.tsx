import React, { useState, useEffect } from 'react';
import { DollarSign, Receipt, TrendingUp, CreditCard, Banknote, Smartphone, Printer, RefreshCw, Calendar, ArrowLeft } from 'lucide-react';
import { TodayReport, Settings } from '../types';
import { api } from '../services/api';

interface ReportsPageProps {
  settings: Settings;
  paperSize: '80mm' | '58mm';
  onBackToPOS?: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ settings, paperSize, onBackToPOS }) => {
  const currency = settings?.currency_symbol || '৳';
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
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-800 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Mobile Back to POS Button */}
      {onBackToPOS && (
        <button
          type="button"
          onClick={onBackToPOS}
          className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-[#026cb6] rounded-xl text-xs font-bold border border-slate-200 shadow-xs w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order Terminal</span>
        </button>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div>
          <h2 className="text-xl font-black text-slate-900">Daily Sales &amp; Reconciliation (Z-Report)</h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#026cb6]" />
            <span>Date: {report?.date || new Date().toISOString().split('T')[0]}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handlePrintZReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#026cb6] hover:bg-[#025a98] text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Print Z-Report ({paperSize})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          Generating daily sales analytics...
        </div>
      ) : report ? (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                <div className="p-2 bg-blue-50 text-[#026cb6] rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900">{currency}{report.total_sales.toFixed(2)}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Tax collected: {currency}{report.total_tax.toFixed(2)}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Completed Orders</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900">{report.total_orders}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Discounts given: {currency}{report.total_discount.toFixed(2)}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Average Check</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900">{currency}{report.average_check.toFixed(2)}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Per dining check</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Cash vs Digital</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                {currency}{(report.payment_breakdown.CASH || 0).toFixed(2)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Digital/Card: {currency}{((report.payment_breakdown.CARD || 0) + (report.payment_breakdown.MOBILE || 0)).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Two Column Layout: Payment Methods & Top Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
            {/* Payment Method Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-base text-slate-900">Payment Method Breakdown</h4>
              <div className="space-y-3">
                {[
                  { label: 'Cash in Drawer', key: 'CASH', icon: Banknote, color: 'text-emerald-600' },
                  { label: 'Credit / Debit Card', key: 'CARD', icon: CreditCard, color: 'text-indigo-600' },
                  { label: 'Mobile Wallets / QR', key: 'MOBILE', icon: Smartphone, color: 'text-amber-600' },
                  { label: 'Split Payments', key: 'SPLIT', icon: Receipt, color: 'text-purple-600' },
                ].map(({ label, key, icon: Icon, color }) => {
                  const amt = report.payment_breakdown[key] || 0;
                  const pct = report.total_sales > 0 ? (amt / report.total_sales) * 100 : 0;
                  return (
                    <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${color}`} />
                          <span className="text-xs font-semibold text-slate-700">{label}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{currency}{amt.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#026cb6] h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Selling Items */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-base text-slate-900">Top Selling Items Today</h4>
              {report.top_items.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No items sold yet today.</p>
              ) : (
                <div className="space-y-2.5">
                  {report.top_items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 w-4">#{idx + 1}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.item_name}</p>
                          <span className="text-[11px] text-slate-500">{item.quantity} sold</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#026cb6]">
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
