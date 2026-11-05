import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, FileText, Utensils, Printer, X, User, 
  Wifi, BatteryMedium, Percent
} from 'lucide-react';
import { Category, MenuItem, Settings, Order, Payment } from '../types';
import { QuickProductCard } from '../components/v2/QuickProductCard';
import { QuickPaymentSheet } from '../components/v2/QuickPaymentSheet';
import { OrderSuccessModal } from '../components/v2/OrderSuccessModal';
import { ThermalReceipt } from '../components/ThermalReceipt';
import { QuickCartItem } from '../components/v2/OrderConfirmSheet';
import { api } from '../services/api';
import { sound } from '../services/sound';

interface QuickPOSPageProps {
  categories: Category[];
  menuItems: MenuItem[];
  settings: Settings;
  onRefreshData: () => void;
}

export const QuickPOSPage: React.FC<QuickPOSPageProps> = ({
  categories,
  menuItems,
  settings,
  onRefreshData
}) => {
  const currency = settings?.currency_symbol || '₹';

  // Order State
  const [cartItems, setCartItems] = useState<QuickCartItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | 'ALL' | 'SELECTED'>('ALL');
  const [waiterName, setWaiterName] = useState('Staff 1');
  const [tableNumber, setTableNumber] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Discount State
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountFlat, setDiscountFlat] = useState<number>(0);

  // Modals
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showViewBillModal, setShowViewBillModal] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [successResult, setSuccessResult] = useState<{ order: Order; payment: Payment } | null>(null);
  const [kotToast, setKotToast] = useState<string | null>(null);

  // Calculations
  const rawSubtotal = cartItems.reduce((sum, it) => sum + (it.menuItem.price * it.quantity), 0);
  const discountAmount = discountPercent > 0 
    ? Math.round(rawSubtotal * (discountPercent / 100))
    : Math.min(rawSubtotal, discountFlat);
  const subtotalAfterDiscount = Math.max(0, rawSubtotal - discountAmount);
  const taxRate = settings?.tax_percentage || 5.0;
  const taxAmount = Math.round((subtotalAfterDiscount * (taxRate / 100)) * 100) / 100;
  const grandTotal = Math.round((subtotalAfterDiscount + taxAmount) * 100) / 100;

  // Filter products by category
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCatId === 'SELECTED') {
        return cartItems.some(it => it.menuItem.id === item.id);
      }
      if (selectedCatId !== 'ALL') {
        return item.category_id === selectedCatId;
      }
      return true;
    });
  }, [menuItems, selectedCatId, cartItems]);

  // Cart actions
  const getItemQuantity = (itemId: number) => {
    const found = cartItems.find(it => it.menuItem.id === itemId);
    return found ? found.quantity : 0;
  };

  const handleAddItem = (item: MenuItem) => {
    setCartItems(prev => {
      const idx = prev.findIndex(it => it.menuItem.id === item.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const handleDecrementItem = (item: MenuItem) => {
    setCartItems(prev => {
      return prev.map(it => {
        if (it.menuItem.id === item.id) {
          const newQty = it.quantity - 1;
          return newQty > 0 ? { ...it, quantity: newQty } : null;
        }
        return it;
      }).filter(Boolean) as QuickCartItem[];
    });
  };

  const handleDiscard = () => {
    if (cartItems.length === 0) return;
    if (confirm('Are you sure you want to discard this order?')) {
      setCartItems([]);
      setDiscountPercent(0);
      setDiscountFlat(0);
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  // KOT Trigger Action
  const handleFireKOT = async () => {
    if (cartItems.length === 0) {
      alert('Please add items to the order first.');
      return;
    }
    try {
      const itemsPayload = cartItems.map(it => ({
        menu_item_id: it.menuItem.id,
        quantity: it.quantity,
        notes: it.notes
      }));

      const newOrder = await api.createOrder({
        table_id: null,
        order_type: 'DINE_IN',
        customer_name: customerName || `Table ${tableNumber}`,
        waiter_name: waiterName,
        notes: `Table: ${tableNumber}`,
        items: itemsPayload
      });

      sound.playKitchenBell();
      setKotToast(`KOT generated for Table ${tableNumber}! Order #${newOrder.order_number.slice(-3)}`);
      setTimeout(() => setKotToast(null), 3500);
      onRefreshData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to send KOT');
    }
  };

  // Quick Print Action
  const handleQuickPrint = () => {
    if (cartItems.length === 0) {
      alert('Please add items to print receipt.');
      return;
    }
    setShowPrintModal(true);
  };

  const handleStartNewOrder = () => {
    setCartItems([]);
    setDiscountPercent(0);
    setDiscountFlat(0);
    setCustomerName('');
    setCustomerPhone('');
    setSuccessResult(null);
    setShowPrintModal(false);
  };

  // Simulated Order object for quick printing preview
  const currentPreviewOrder: Order = {
    id: 0,
    order_number: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-TMP`,
    table_id: parseInt(tableNumber) || 1,
    order_type: 'DINE_IN',
    status: 'ACTIVE',
    subtotal: rawSubtotal,
    discount_percent: discountPercent,
    discount_amount: discountAmount,
    tax_percent: taxRate,
    tax_amount: taxAmount,
    service_charge: 0,
    total_amount: grandTotal,
    customer_name: customerName,
    waiter_name: waiterName,
    created_at: new Date().toISOString(),
    items: cartItems.map((c, i) => ({
      id: i + 1,
      order_id: 0,
      menu_item_id: c.menuItem.id,
      item_name: c.menuItem.name,
      unit_price: c.menuItem.price,
      quantity: c.quantity,
      total_price: c.menuItem.price * c.quantity,
      notes: c.notes,
      status: 'PENDING',
      kot_round: 1,
      created_at: new Date().toISOString()
    }))
  };

  return (
    <div className="flex-1 flex justify-center bg-slate-900 overflow-y-auto p-0 sm:py-4">
      {/* Handheld Device Shell (Matches exact mobile mockup) */}
      <div className="w-full max-w-md bg-[#f1f5f9] min-h-screen sm:min-h-[820px] sm:max-h-[860px] sm:rounded-[36px] shadow-2xl border-0 sm:border-8 sm:border-slate-800 flex flex-col overflow-hidden relative font-sans">
        
        {/* Status Bar (Time, Battery, Wi-Fi) */}
        <div className="bg-[#026cb6] text-white px-5 pt-2 pb-1 flex items-center justify-between text-xs font-semibold select-none">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="w-20 h-4 bg-black/30 rounded-full mx-auto hidden sm:block"></div>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>

        {/* Top Header Bar */}
        <div className="bg-[#026cb6] text-white px-4 py-2.5 flex items-center justify-between select-none shadow-md">
          <button
            type="button"
            onClick={() => handleDiscard()}
            className="p-1 hover:bg-white/10 rounded-lg transition"
            title="Back / Reset"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <h2 className="text-base font-bold text-white tracking-wide">Order</h2>

          <div 
            onClick={() => setShowCustomerModal(true)}
            className="text-right cursor-pointer hover:opacity-90 transition leading-tight"
          >
            <span className="text-[10px] text-blue-100 block">Table No.</span>
            <span className="text-sm font-extrabold text-white">{tableNumber || '1'}</span>
          </div>
        </div>

        {/* Scrollable Category Filter Pills (No white border or background) */}
        <div className="px-3 pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none select-none">
          {/* Selected items filter pill */}
          <button
            type="button"
            onClick={() => setSelectedCatId('SELECTED')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition ${
              selectedCatId === 'SELECTED'
                ? 'bg-[#084c94] text-white shadow-xs'
                : 'bg-[#026cb6] text-white/95 hover:bg-[#084c94]'
            }`}
          >
            Selected {cartItems.length > 0 && `(${cartItems.reduce((a, b) => a + b.quantity, 0)})`}
          </button>

          {/* All items */}
          <button
            type="button"
            onClick={() => setSelectedCatId('ALL')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition ${
              selectedCatId === 'ALL'
                ? 'bg-[#084c94] text-white shadow-xs'
                : 'bg-[#026cb6] text-white/95 hover:bg-[#084c94]'
            }`}
          >
            All
          </button>

          {/* Category List */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-3 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition ${
                selectedCatId === cat.id
                  ? 'bg-[#084c94] text-white shadow-xs'
                  : 'bg-[#026cb6] text-white/95 hover:bg-[#084c94]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid Area (3 Columns exact match) */}
        <div className="flex-1 p-2 sm:p-2.5 overflow-y-auto pb-32">
          {filteredItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No products found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredItems.map((item) => (
                <QuickProductCard
                  key={item.id}
                  item={item}
                  quantity={getItemQuantity(item.id)}
                  currencySymbol={currency}
                  onAdd={handleAddItem}
                  onDecrement={handleDecrementItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Toast Notification (e.g. KOT generated) */}
        {kotToast && (
          <div className="absolute top-28 left-4 right-4 bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xl flex items-center justify-between z-50 animate-in fade-in slide-in-from-top-2">
            <span>✓ {kotToast}</span>
            <button onClick={() => setKotToast(null)} className="text-white ml-2">✕</button>
          </div>
        )}

        {/* ================= FIXED BOTTOM ACTION DOCK ================= */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#f8fafc] border-t-2 border-slate-200/90 p-2 sm:p-2.5 space-y-2 z-40 shadow-2xl">
          
          {/* Row 1: [Discount]  [Customer]  [Total: 2794.00] */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <button
              type="button"
              onClick={() => setShowDiscountModal(true)}
              className="py-1.5 px-2 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-md text-xs font-bold transition shadow-xs flex items-center justify-center gap-1"
            >
              <Percent className="w-3 h-3" />
              <span>Discount</span>
              {discountPercent > 0 && <span className="text-[10px] bg-white/20 px-1 rounded">{discountPercent}%</span>}
            </button>

            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="py-1.5 px-2 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-md text-xs font-bold transition shadow-xs flex items-center justify-center gap-1"
            >
              <User className="w-3 h-3" />
              <span>Customer</span>
            </button>

            {/* Total Box */}
            <div className="bg-white border border-slate-300 rounded-md py-1.5 px-2 text-center shadow-xs">
              <span className="text-[11px] font-extrabold text-slate-800 tracking-tight">
                Total: {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Row 2: Four Action Buttons: [View Bill] [KOT] [Quick Print] [Discard] */}
          <div className="grid grid-cols-4 gap-1.5">
            {/* View Bill */}
            <button
              type="button"
              onClick={() => setShowViewBillModal(true)}
              className="py-2 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-md flex flex-col items-center justify-center transition shadow-xs active:scale-95"
            >
              <FileText className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-bold leading-tight">View Bill</span>
            </button>

            {/* KOT */}
            <button
              type="button"
              onClick={handleFireKOT}
              className="py-2 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-md flex flex-col items-center justify-center transition shadow-xs active:scale-95"
            >
              <Utensils className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-bold leading-tight">KOT</span>
            </button>

            {/* Quick Print */}
            <button
              type="button"
              onClick={handleQuickPrint}
              className="py-2 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-md flex flex-col items-center justify-center transition shadow-xs active:scale-95"
            >
              <Printer className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-bold leading-tight">Quick Print</span>
            </button>

            {/* Discard */}
            <button
              type="button"
              onClick={handleDiscard}
              className="py-2 bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white rounded-md flex flex-col items-center justify-center transition shadow-xs active:scale-95"
            >
              <X className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-bold leading-tight">Discard</span>
            </button>
          </div>
        </div>

        {/* ================= MODALS ================= */}

        {/* 1. DISCOUNT MODAL */}
        {showDiscountModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white text-slate-800 rounded-2xl p-4 w-full max-w-xs shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-slate-800">Apply Discount</h3>
                <button onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Percentage Discount</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercent(pct)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                        discountPercent === pct
                          ? 'bg-[#026cb6] text-white border-[#026cb6]'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Flat Discount ({currency})</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={discountFlat || ''}
                  onChange={(e) => {
                    setDiscountFlat(parseFloat(e.target.value) || 0);
                    setDiscountPercent(0);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#026cb6]"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="w-full py-2 bg-[#026cb6] text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* 2. CUSTOMER / TABLE MODAL */}
        {showCustomerModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white text-slate-800 rounded-2xl p-4 w-full max-w-xs shadow-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-slate-800">Customer &amp; Table Details</h3>
                <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Table Number</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. 1, 2, 3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#026cb6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Guest name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#026cb6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile No (Optional)</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#026cb6]"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="w-full py-2 bg-[#026cb6] text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* 3. VIEW BILL / CHECKOUT MODAL */}
        {showViewBillModal && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-t-3xl shadow-2xl p-4 max-h-[85%] flex flex-col text-slate-800 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">Current Bill</h3>
                  <p className="text-xs text-slate-400">Table #{tableNumber} • Server: {waiterName}</p>
                </div>
                <button onClick={() => setShowViewBillModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2">
                {cartItems.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">No items in bill</p>
                ) : (
                  cartItems.map(it => (
                    <div key={it.menuItem.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5">
                      <div>
                        <span className="font-bold text-slate-800 mr-2">{it.quantity}x</span>
                        <span className="text-slate-700">{it.menuItem.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{currency}{(it.menuItem.price * it.quantity).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Calculation Summary */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{currency}{rawSubtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>Discount:</span>
                    <span>-{currency}{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Tax ({taxRate}%):</span>
                  <span>{currency}{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Due:</span>
                  <span className="text-[#026cb6]">{currency}{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewBillModal(false);
                    setShowPrintModal(true);
                  }}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300"
                >
                  Print Slip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowViewBillModal(false);
                    setShowPaymentSheet(true);
                  }}
                  disabled={cartItems.length === 0}
                  className="py-2.5 bg-[#026cb6] hover:bg-[#025a98] text-white rounded-xl text-xs font-extrabold shadow-sm disabled:opacity-50"
                >
                  Settle &amp; Pay ({currency}{grandTotal.toFixed(2)})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. PAYMENT SHEET */}
        {showPaymentSheet && (
          <QuickPaymentSheet
            items={cartItems}
            settings={settings}
            customerName={customerName || `Table ${tableNumber}`}
            orderType="DINE_IN"
            tableNumber={tableNumber}
            onBack={() => {
              setShowPaymentSheet(false);
              setShowViewBillModal(true);
            }}
            onClose={() => setShowPaymentSheet(false)}
            onSuccess={(result) => {
              setShowPaymentSheet(false);
              setSuccessResult(result);
              onRefreshData();
            }}
          />
        )}

        {/* 5. SUCCESS MODAL */}
        {successResult && !showPrintModal && (
          <OrderSuccessModal
            order={successResult.order}
            payment={successResult.payment}
            settings={settings}
            onPrintReceipt={() => setShowPrintModal(true)}
            onNewOrder={handleStartNewOrder}
          />
        )}

        {/* 6. THERMAL RECEIPT PRINT MODAL */}
        {showPrintModal && (
          <ThermalReceipt
            order={successResult ? successResult.order : currentPreviewOrder}
            settings={settings}
            payment={successResult?.payment || null}
            paperSize={settings.printer_paper_size || '80mm'}
            autoPrint={false}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </div>
    </div>
  );
};
