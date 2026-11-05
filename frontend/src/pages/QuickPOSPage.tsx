import React, { useState, useMemo } from 'react';
import { 
  Menu, FileText, Printer, X, User, 
  Wifi, BatteryMedium, Percent, Trash2, Plus, Minus, Check, AlertTriangle,
  ShoppingBag, Utensils
} from 'lucide-react';
import { Category, MenuItem, Settings, Order, Payment } from '../types';
import { QuickProductCard } from '../components/v2/QuickProductCard';
import { QuickPaymentSheet } from '../components/v2/QuickPaymentSheet';
import { QuickTableSheet } from '../components/v2/QuickTableSheet';
import { OrderSuccessModal } from '../components/v2/OrderSuccessModal';
import { ThermalReceipt } from '../components/ThermalReceipt';
import { QuickCartItem } from '../components/v2/OrderConfirmSheet';
import { api } from '../services/api';
import { haptics } from '../services/haptics';

interface QuickPOSPageProps {
  categories: Category[];
  menuItems: MenuItem[];
  settings: Settings;
  isWsConnected?: boolean;
  onRefreshData: () => void;
  onOpenDrawer?: () => void;
}

const COMMON_CHEF_NOTES = ['Less Spicy', 'Extra Spicy', 'No Onion', 'Extra Sauce', 'Pack Separate'];

export const QuickPOSPage: React.FC<QuickPOSPageProps> = ({
  categories,
  menuItems,
  settings,
  isWsConnected = true,
  onRefreshData,
  onOpenDrawer
}) => {
  const currency = settings?.currency_symbol || '৳';

  // Order State
  const [cartItems, setCartItems] = useState<QuickCartItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | 'ALL' | 'SELECTED'>('ALL');
  const [waiterName] = useState('Staff 1');
  const [tableNumber, setTableNumber] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Discount State
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountFlat, setDiscountFlat] = useState<number>(0);

  // Modals / Sheets
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showViewBillModal, setShowViewBillModal] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [successResult, setSuccessResult] = useState<{ order: Order; payment: Payment } | null>(null);

  // Calculations
  const rawSubtotal = cartItems.reduce((sum, it) => sum + (it.menuItem.price * it.quantity), 0);
  const discountAmount = discountPercent > 0 
    ? Math.round(rawSubtotal * (discountPercent / 100))
    : Math.min(rawSubtotal, discountFlat);
  const subtotalAfterDiscount = Math.max(0, rawSubtotal - discountAmount);
  const taxRate = settings?.tax_percentage || 5.0;
  const taxAmount = Math.round((subtotalAfterDiscount * (taxRate / 100)) * 100) / 100;
  const grandTotal = Math.round((subtotalAfterDiscount + taxAmount) * 100) / 100;
  const totalItemCount = cartItems.reduce((sum, it) => sum + it.quantity, 0);

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

  const handleRemoveItem = (itemId: number) => {
    haptics.tap();
    setCartItems(prev => prev.filter(it => it.menuItem.id !== itemId));
  };

  const handleUpdateItemNote = (itemId: number, note: string) => {
    haptics.tap();
    setCartItems(prev => prev.map(it => {
      if (it.menuItem.id === itemId) {
        return { ...it, notes: it.notes ? `${it.notes}, ${note}` : note };
      }
      return it;
    }));
  };

  const handleDiscardPrompt = () => {
    if (cartItems.length === 0) return;
    haptics.warning();
    setShowDiscardConfirm(true);
  };

  const handleConfirmDiscard = () => {
    haptics.warning();
    setCartItems([]);
    setDiscountPercent(0);
    setDiscountFlat(0);
    setCustomerName('');
    setCustomerPhone('');
    setShowDiscardConfirm(false);
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

  // Simulated Order object for receipt printing preview
  const currentPreviewOrder: Order = {
    id: 0,
    order_number: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-TMP`,
    table_id: parseInt(tableNumber) || 1,
    order_type: tableNumber.toLowerCase().includes('takeaway') ? 'TAKEAWAY' : 'DINE_IN',
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
    <div className="flex-1 flex overflow-hidden w-full h-full bg-slate-100 font-sans">
      
      {/* ========================================================================= */}
      {/* 1. MOBILE APP VIEW (< md breakpoint, fills phone screen seamlessly)       */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col w-full h-[100dvh] bg-[#f8fafc] overflow-hidden relative">
        {/* Status Bar (Time, Battery, Wi-Fi) */}
        <div className="bg-[#026cb6] text-white px-4 pt-1.5 pb-1 flex items-center justify-between text-[11px] font-semibold select-none shrink-0">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-400' : 'bg-amber-300'}`} />
            <Wifi className="w-3 h-3" />
            <BatteryMedium className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Top Header Bar (Unified Mobile App Bar) */}
        <div className="bg-[#026cb6] text-white px-3.5 py-2.5 flex items-center justify-between select-none shadow-md shrink-0">
          <button
            type="button"
            onClick={onOpenDrawer}
            className="p-1.5 hover:bg-white/15 active:bg-white/25 rounded-xl transition touch-manipulation"
            title="Menu Drawer"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          <div className="text-center">
            <h2 className="text-base font-extrabold text-white tracking-wide leading-none flex items-center justify-center gap-1.5">
              <span>Order</span>
              {totalItemCount > 0 && (
                <span className="text-[10px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-full">
                  {totalItemCount}
                </span>
              )}
            </h2>
          </div>

          <button 
            type="button"
            onClick={() => {
              haptics.tap();
              setShowTableModal(true);
            }}
            className="text-right cursor-pointer hover:opacity-90 active:scale-95 transition leading-tight bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-xl"
            title="Change Table"
          >
            <span className="text-[9px] text-blue-100 block font-semibold">Table No.</span>
            <span className="text-xs font-black text-white">{tableNumber || '1'}</span>
          </button>
        </div>

        {/* Scrollable Category Filter Pills */}
        <div className="px-3 pt-2.5 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none select-none shrink-0 bg-white border-b border-slate-200/70">
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setSelectedCatId('SELECTED');
            }}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition touch-manipulation active:scale-95 ${
              selectedCatId === 'SELECTED'
                ? 'bg-[#084c94] text-white shadow-xs'
                : 'bg-[#026cb6] text-white/95 hover:bg-[#084c94]'
            }`}
          >
            Selected {cartItems.length > 0 && `(${totalItemCount})`}
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setSelectedCatId('ALL');
            }}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition touch-manipulation active:scale-95 ${
              selectedCatId === 'ALL'
                ? 'bg-[#084c94] text-white shadow-xs'
                : 'bg-[#026cb6] text-white/95 hover:bg-[#084c94]'
            }`}
          >
            All
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                haptics.tap();
                setSelectedCatId(cat.id);
              }}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition touch-manipulation active:scale-95 ${
                selectedCatId === cat.id
                  ? 'bg-[#084c94] text-white shadow-xs'
                  : 'bg-[#026cb6] text-white/95 hover:bg-[#084c94]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Mobile Product Grid Area (3 Columns exact match, safe scroll padding) */}
        <div className="flex-1 p-2 overflow-y-auto pb-36 overscroll-contain">
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

        {/* ================= FIXED BOTTOM ACTION DOCK (THUMB ZONE) ================= */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#f8fafc] border-t-2 border-slate-200/90 p-2 space-y-2 z-40 shadow-2xl pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          {/* Row 1: [Discount]  [Customer]  [Total: 2794.00] */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                setShowDiscountModal(true);
              }}
              className="py-1.5 px-2 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-md text-xs font-bold transition shadow-xs flex items-center justify-center gap-1 touch-manipulation active:scale-95"
            >
              <Percent className="w-3 h-3" />
              <span>Discount</span>
              {discountPercent > 0 && <span className="text-[10px] bg-white/20 px-1 rounded">{discountPercent}%</span>}
              {discountFlat > 0 && <span className="text-[10px] bg-white/20 px-1 rounded">{currency}{discountFlat}</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.tap();
                setShowTableModal(true);
              }}
              className="py-1.5 px-2 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-md text-xs font-bold transition shadow-xs flex items-center justify-center gap-1 touch-manipulation active:scale-95"
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

          {/* Row 2: Action Buttons: [View Bill] [Discard] (KOT and Quick Print Removed) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                setShowViewBillModal(true);
              }}
              className="col-span-2 py-2.5 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-md flex items-center justify-center gap-1.5 transition shadow-xs active:scale-95 touch-manipulation font-bold text-xs"
            >
              <FileText className="w-4 h-4" />
              <span>View Bill {totalItemCount > 0 && `(${totalItemCount})`}</span>
            </button>

            <button
              type="button"
              onClick={handleDiscardPrompt}
              className="col-span-1 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white rounded-md flex items-center justify-center gap-1 transition shadow-xs active:scale-95 touch-manipulation font-bold text-xs"
            >
              <X className="w-4 h-4" />
              <span>Discard</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP MODE (Automatic on PC / Laptop screen width >= md)              */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-1 h-full overflow-hidden">
        
        {/* Left Side: Category Pills + Responsive Product Grid (65-70% width) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 border-r border-slate-200">
          
          {/* Desktop Category Bar */}
          <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <button
                type="button"
                onClick={() => setSelectedCatId('SELECTED')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                  selectedCatId === 'SELECTED'
                    ? 'bg-[#026cb6] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Selected ({totalItemCount})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCatId('ALL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                  selectedCatId === 'ALL'
                    ? 'bg-[#026cb6] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Products
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shadow-xs ${
                    selectedCatId === cat.id
                      ? 'bg-[#026cb6] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="text-xs font-bold text-slate-400 shrink-0">
              {filteredItems.length} items
            </div>
          </div>

          {/* Desktop Product Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="py-24 text-center text-slate-400 text-sm">
                No products found in this category.
              </div>
            ) : (
              <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
        </div>

        {/* Right Side: Persistent Desktop Order Bill Panel (30-35% width) */}
        <div className="w-80 lg:w-96 flex flex-col h-full bg-white border-l border-slate-200 shadow-sm shrink-0">
          
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">Current Order</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#026cb6]">
                  {tableNumber.toLowerCase().includes('takeaway') ? 'Takeaway' : `Table ${tableNumber}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{waiterName} • {customerName || 'Walk-in Guest'}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowTableModal(true)}
              className="text-xs font-bold text-[#026cb6] hover:underline px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-xs"
            >
              Change
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6 space-y-2">
                <FileText className="w-8 h-8 text-slate-300" />
                <p className="font-medium">Order is currently empty</p>
                <p className="text-[11px] text-slate-400">Click food items from the menu to start order</p>
              </div>
            ) : (
              cartItems.map((it) => (
                <div key={it.menuItem.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <h4 className="font-bold text-xs text-slate-800">{it.menuItem.name}</h4>
                      <span className="text-[10px] text-slate-500">{currency}{it.menuItem.price.toFixed(2)} each</span>
                      {it.notes && (
                        <p className="text-[10px] text-amber-700 font-semibold">*{it.notes}</p>
                      )}
                    </div>
                    <span className="font-black text-xs text-slate-900">
                      {currency}{(it.menuItem.price * it.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Stepper & Chef Notes */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                      {COMMON_CHEF_NOTES.slice(0, 2).map((note) => (
                        <button
                          key={note}
                          type="button"
                          onClick={() => handleUpdateItemNote(it.menuItem.id, note)}
                          className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-medium text-slate-600 hover:bg-slate-100"
                        >
                          +{note}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDecrementItem(it.menuItem)}
                        className="w-5 h-5 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs w-4 text-center">{it.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleAddItem(it.menuItem)}
                        className="w-5 h-5 flex items-center justify-center bg-[#026cb6] text-white rounded hover:bg-[#025a98]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.menuItem.id)}
                        className="p-1 text-slate-400 hover:text-red-500 ml-0.5"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discount Chips */}
          <div className="px-3 pt-2 pb-1 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-500">Quick Discount:</span>
              {discountPercent > 0 && <span className="text-[10px] font-bold text-emerald-600">{discountPercent}% applied</span>}
              {discountFlat > 0 && <span className="text-[10px] font-bold text-emerald-600">{currency}{discountFlat} applied</span>}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[0, 5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setDiscountPercent(pct);
                    setDiscountFlat(0);
                  }}
                  className={`py-1 rounded text-[10px] font-bold border transition ${
                    discountPercent === pct
                      ? 'bg-[#026cb6] text-white border-[#026cb6]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pct === 0 ? 'Off' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Cost Summary Box */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-700">{currency}{rawSubtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600 font-semibold">
                <span>Discount:</span>
                <span>-{currency}{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Tax ({taxRate}%):</span>
              <span className="font-semibold text-slate-700">{currency}{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Total Due:</span>
              <span className="text-[#026cb6] text-base">{currency}{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Desktop Bottom Action Buttons (Settle & Pay and Discard) */}
          <div className="p-3 bg-white border-t border-slate-200 grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={() => setShowPaymentSheet(true)}
              className="col-span-2 py-3 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-40"
            >
              Settle &amp; Pay ({currency}{grandTotal.toFixed(2)})
            </button>

            <button
              type="button"
              onClick={handleDiscardPrompt}
              disabled={cartItems.length === 0}
              className="col-span-1 py-3 bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-40"
            >
              Discard
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SHARED MODALS & SHEETS                                                 */}
      {/* ========================================================================= */}

      {/* Table Selector Sheet */}
      {showTableModal && (
        <QuickTableSheet
          tableNumber={tableNumber}
          customerName={customerName}
          customerPhone={customerPhone}
          onSelectTable={setTableNumber}
          onUpdateCustomerName={setCustomerName}
          onUpdateCustomerPhone={setCustomerPhone}
          onClose={() => setShowTableModal(false)}
        />
      )}

      {/* Mobile Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white text-slate-800 rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-xs shadow-2xl border border-slate-200 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">Apply Discount</h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Percentage Discount</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      setDiscountPercent(pct);
                      setDiscountFlat(0);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition touch-manipulation active:scale-95 ${
                      discountPercent === pct
                        ? 'bg-[#026cb6] text-white border-[#026cb6]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {pct === 0 ? 'Off' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Flat Discount ({currency})</label>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[20, 50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      setDiscountFlat(amt);
                      setDiscountPercent(0);
                    }}
                    className={`py-1 rounded-lg text-xs font-bold border transition ${
                      discountFlat === amt
                        ? 'bg-[#026cb6] text-white border-[#026cb6]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {currency}{amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Custom amount (৳)"
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
              className="w-full py-2 bg-[#026cb6] hover:bg-[#025a98] text-white rounded-lg text-xs font-bold shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Discard Confirmation Sheet */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white text-slate-800 rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-slate-200 text-center space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Discard Current Order?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will remove {totalItemCount} item(s) from Table {tableNumber}.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Yes, Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile View Bill Bottom Sheet */}
      {showViewBillModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in md:hidden">
          <div className="bg-white rounded-t-3xl shadow-2xl p-4 max-h-[88%] flex flex-col text-slate-800 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-2" />
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-base text-slate-800">Current Bill</h3>
                <p className="text-xs text-slate-500">Table #{tableNumber} • Server: {waiterName}</p>
              </div>
              <button onClick={() => setShowViewBillModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            {/* Items List with Mobile Steppers & Modifier Chips */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {cartItems.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No items in bill yet</p>
              ) : (
                cartItems.map(it => (
                  <div key={it.menuItem.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-start text-xs">
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-slate-800 text-xs sm:text-sm">{it.menuItem.name}</p>
                        <span className="text-[11px] text-slate-500">{currency}{it.menuItem.price.toFixed(2)} each</span>
                        {it.notes && (
                          <p className="text-[10px] text-amber-700 font-semibold mt-0.5">*{it.notes}</p>
                        )}
                      </div>
                      <span className="font-black text-xs sm:text-sm text-[#026cb6]">
                        {currency}{(it.menuItem.price * it.quantity).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                        {COMMON_CHEF_NOTES.slice(0, 3).map((note) => (
                          <button
                            key={note}
                            type="button"
                            onClick={() => handleUpdateItemNote(it.menuItem.id, note)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-semibold text-slate-600 hover:bg-slate-100 whitespace-nowrap active:scale-95"
                          >
                            +{note}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => handleDecrementItem(it.menuItem)}
                          className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-md text-slate-700 active:scale-90"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-extrabold text-xs w-4 text-center">{it.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleAddItem(it.menuItem)}
                          className="w-6 h-6 flex items-center justify-center bg-[#026cb6] text-white rounded-md active:scale-90"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.menuItem.id)}
                          className="p-1 text-slate-400 hover:text-red-500 ml-1"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
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
                <span className="text-[#026cb6] text-base">{currency}{grandTotal.toFixed(2)}</span>
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
                className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold border border-slate-200"
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
                className="py-2.5 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-xl text-xs font-extrabold shadow-md disabled:opacity-50 touch-manipulation active:scale-95"
              >
                Settle &amp; Pay ({currency}{grandTotal.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Sheet */}
      {showPaymentSheet && (
        <QuickPaymentSheet
          items={cartItems}
          settings={settings}
          customerName={customerName || `Table ${tableNumber}`}
          orderType={tableNumber.toLowerCase().includes('takeaway') ? 'TAKEAWAY' : 'DINE_IN'}
          tableNumber={tableNumber}
          onBack={() => {
            setShowPaymentSheet(false);
            if (window.innerWidth < 768) {
              setShowViewBillModal(true);
            }
          }}
          onClose={() => setShowPaymentSheet(false)}
          onSuccess={(result) => {
            setShowPaymentSheet(false);
            setSuccessResult(result);
            onRefreshData();
          }}
        />
      )}

      {/* Success Modal */}
      {successResult && !showPrintModal && (
        <OrderSuccessModal
          order={successResult.order}
          payment={successResult.payment}
          settings={settings}
          onPrintReceipt={() => setShowPrintModal(true)}
          onNewOrder={handleStartNewOrder}
        />
      )}

      {/* Thermal Receipt Print Modal */}
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
  );
};
