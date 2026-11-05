import React, { useState } from 'react';
import { 
  FileText, X, User, Percent, Trash2, Plus, Minus, AlertTriangle, CreditCard
} from 'lucide-react';
import { Category, MenuItem, Settings, Order, Payment } from '../types';
import { QuickProductCard } from '../components/v2/QuickProductCard';
import { QuickPaymentSheet } from '../components/v2/QuickPaymentSheet';
import { QuickTableSheet } from '../components/v2/QuickTableSheet';
import { QuickDiscountModal } from '../components/v2/QuickDiscountModal';
import { QuickCustomerModal } from '../components/v2/QuickCustomerModal';
import { MobileBillSheet } from '../components/v2/MobileBillSheet';
import { OrderSuccessModal } from '../components/v2/OrderSuccessModal';
import { ThermalReceipt } from '../components/ThermalReceipt';
import { QuickCartItem } from '../components/v2/OrderConfirmSheet';
import { api } from '../services/api';
import { haptics } from '../services/haptics';

interface QuickPOSPageProps {
  categories?: Category[];
  menuItems: MenuItem[];
  settings: Settings;
  isWsConnected?: boolean;
  isMobileView?: boolean;
  onRefreshData: () => void;
  onOpenDrawer?: () => void;
  tableNumber: string;
  setTableNumber: (tbl: string) => void;
  showTableModal: boolean;
  setShowTableModal: (show: boolean) => void;
}

export const QuickPOSPage: React.FC<QuickPOSPageProps> = ({
  menuItems,
  settings,
  isMobileView = false,
  tableNumber,
  setTableNumber,
  showTableModal,
  setShowTableModal,
  onRefreshData
}) => {
  const currency = settings?.currency_symbol || '৳';

  // Order State
  const [cartItems, setCartItems] = useState<QuickCartItem[]>([]);
  const [waiterName] = useState('Staff 1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Discount State
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountFlat, setDiscountFlat] = useState<number>(0);

  // Modals / Sheets
  const [showBillSheet, setShowBillSheet] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
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

  // Preview Order for thermal receipt
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
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden w-full bg-slate-100 font-sans">
      
      {/* ========================================================================= */}
      {/* 1. PRODUCT CATALOG AREA (Left 65-70% on Desktop, Full Flex on Mobile)     */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        
        {/* Product Cards Grid: 3-column on mobile, 4-6 columns on desktop */}
        <div className="flex-1 p-2 sm:p-3 overflow-y-auto overscroll-contain">
          {menuItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs sm:text-sm">
              No products found in menu catalog.
            </div>
          ) : (
            <div className={`grid gap-2 sm:gap-3 ${
              isMobileView 
                ? 'grid-cols-3' 
                : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            }`}>
              {menuItems.map((item) => (
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

        {/* ========================================================================= */}
        {/* MOBILE BOTTOM DOCK (Matches User's Mockup Exactly!)                       */}
        {/* ========================================================================= */}
        {isMobileView && (
          <div className="bg-white border-t border-slate-200 px-2.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xl shrink-0 z-20 space-y-2">
            
            {/* Row 1: [ Discount ]  [ Customer ]  [ Total: ৳... ] */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  setShowDiscountModal(true);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-xs ${
                  discountAmount > 0
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#026cb6] hover:bg-[#084c94] text-white'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span className="truncate">
                  {discountPercent > 0 ? `${discountPercent}% Off` : discountFlat > 0 ? `${currency}${discountFlat} Off` : 'Discount'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  setShowCustomerModal(true);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-xs ${
                  customerName
                    ? 'bg-blue-700 text-white'
                    : 'bg-[#026cb6] hover:bg-[#084c94] text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="truncate">
                  {customerName ? customerName : 'Customer'}
                </span>
              </button>

              {/* White Box for Total display */}
              <div className="border border-slate-300 bg-white rounded-lg py-1.5 px-2 text-center shadow-2xs">
                <span className="text-[10px] text-slate-500 font-medium block leading-none">Total:</span>
                <span className="text-xs font-black text-slate-900 leading-tight block">
                  {currency}{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Row 2: [ View Bill ]  [ Settle & Pay ]  [ Discard ] */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  setShowBillSheet(true);
                }}
                className="col-span-1 py-2.5 px-2 bg-[#026cb6] hover:bg-[#084c94] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate">Bill ({totalItemCount})</span>
              </button>

              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => {
                  haptics.tap();
                  setShowPaymentSheet(true);
                }}
                className="col-span-2 py-2.5 px-3 bg-[#084c94] hover:bg-[#063870] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 shadow-md disabled:opacity-40"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="truncate">Settle &amp; Pay</span>
              </button>

              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={handleDiscardPrompt}
                className="col-span-1 py-2.5 px-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 shadow-xs disabled:opacity-40"
              >
                <X className="w-3.5 h-3.5" />
                <span>Discard</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. ORDER BILL SIDEBAR (DESKTOP MODE ONLY >= 768px)                        */}
      {/* ========================================================================= */}
      {!isMobileView && (
        <div className="w-80 lg:w-96 flex flex-col bg-white border-l border-slate-200 shadow-none shrink-0 z-10">
          
          {/* Order Header Bar */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">Current Order</span>
              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  setShowTableModal(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-[#026cb6] hover:bg-blue-200 transition"
                title="Click to change table"
              >
                <span>{tableNumber.toLowerCase().includes('takeaway') ? 'Takeaway' : `Table ${tableNumber}`}</span>
                <span className="text-[9px] underline">Change</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {totalItemCount > 0 && (
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
          </div>

          {/* Customer info button / preview on desktop */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Customer: <strong className="text-slate-700">{customerName || 'Walk-in'}</strong>
            </span>
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="text-[#026cb6] font-bold text-[11px] hover:underline"
            >
              {customerName ? 'Edit' : '+ Add Info'}
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 overscroll-contain">
            {cartItems.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-1">
                <FileText className="w-8 h-8 text-slate-300" />
                <p className="font-semibold text-slate-500">Cart is empty</p>
                <p className="text-[11px] text-slate-400">Click food cards to add items</p>
              </div>
            ) : (
              cartItems.map((it) => (
                <div key={it.menuItem.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200/90 space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <h4 className="font-bold text-xs text-slate-800 leading-tight">{it.menuItem.name}</h4>
                      <span className="text-[10px] text-slate-500">{currency}{it.menuItem.price.toFixed(2)} each</span>
                      {it.notes && (
                        <p className="text-[10px] text-amber-700 font-semibold leading-tight mt-0.5">*{it.notes}</p>
                      )}
                    </div>
                    <span className="font-black text-xs text-[#026cb6]">
                      {currency}{(it.menuItem.price * it.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Steppers & Remove */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-medium">Qty:</span>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={() => {
                          haptics.tap();
                          handleDecrementItem(it.menuItem);
                        }}
                        className="w-5 h-5 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 active:scale-90"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-extrabold text-xs w-4 text-center">{it.quantity}</span>
                      <button
                        type="button"
                        onClick={() => {
                          haptics.tap();
                          handleAddItem(it.menuItem);
                        }}
                        className="w-5 h-5 flex items-center justify-center bg-[#026cb6] text-white rounded hover:bg-[#025a98] active:scale-90"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.menuItem.id)}
                        className="p-1 text-slate-400 hover:text-red-500 ml-0.5"
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

          {/* Quick Discount Selector Chips */}
          {cartItems.length > 0 && (
            <div className="px-3 pt-1.5 pb-1 border-t border-slate-200 bg-slate-50/70 shrink-0">
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <span className="font-semibold text-slate-500">Discount:</span>
                {discountPercent > 0 && <span className="font-bold text-emerald-600">{discountPercent}% off</span>}
                {discountFlat > 0 && <span className="font-bold text-emerald-600">{currency}{discountFlat} off</span>}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[0, 5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      setDiscountPercent(pct);
                      setDiscountFlat(0);
                    }}
                    className={`py-1 rounded text-[10px] font-bold border transition active:scale-95 ${
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
          )}

          {/* Cost Summary Box */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1 text-xs shrink-0">
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-700">{currency}{rawSubtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600 font-semibold text-[11px]">
                <span>Discount:</span>
                <span>-{currency}{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Tax ({taxRate}%):</span>
              <span className="font-semibold text-slate-700">{currency}{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total:</span>
              <span className="text-[#026cb6] text-base">{currency}{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons: [ Settle & Pay ] and [ Discard ] */}
          <div className="p-3 bg-white border-t border-slate-200 grid grid-cols-3 gap-2 shrink-0">
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={() => {
                haptics.tap();
                setShowPaymentSheet(true);
              }}
              className="col-span-2 py-2.5 bg-[#026cb6] hover:bg-[#025a98] active:bg-[#024a7d] text-white rounded-xl text-xs sm:text-sm font-black shadow-md transition disabled:opacity-40 touch-manipulation active:scale-95"
            >
              Settle &amp; Pay ({currency}{grandTotal.toFixed(2)})
            </button>

            <button
              type="button"
              onClick={handleDiscardPrompt}
              disabled={cartItems.length === 0}
              className="col-span-1 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-40 touch-manipulation active:scale-95"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODALS & SHEETS                                                        */}
      {/* ========================================================================= */}

      {/* Mobile Bill Sheet */}
      <MobileBillSheet
        isOpen={showBillSheet}
        cartItems={cartItems}
        currencySymbol={currency}
        tableNumber={tableNumber}
        customerName={customerName}
        rawSubtotal={rawSubtotal}
        discountAmount={discountAmount}
        taxRate={taxRate}
        taxAmount={taxAmount}
        grandTotal={grandTotal}
        onAddItem={handleAddItem}
        onDecrementItem={handleDecrementItem}
        onRemoveItem={handleRemoveItem}
        onOpenDiscount={() => {
          setShowBillSheet(false);
          setShowDiscountModal(true);
        }}
        onOpenCustomer={() => {
          setShowBillSheet(false);
          setShowCustomerModal(true);
        }}
        onOpenPayment={() => {
          setShowBillSheet(false);
          setShowPaymentSheet(true);
        }}
        onDiscard={handleDiscardPrompt}
        onClose={() => setShowBillSheet(false)}
      />

      {/* Quick Discount Modal */}
      <QuickDiscountModal
        isOpen={showDiscountModal}
        discountPercent={discountPercent}
        discountFlat={discountFlat}
        currencySymbol={currency}
        subtotal={rawSubtotal}
        onApply={(pct, flat) => {
          setDiscountPercent(pct);
          setDiscountFlat(flat);
        }}
        onClose={() => setShowDiscountModal(false)}
      />

      {/* Quick Customer Modal */}
      <QuickCustomerModal
        isOpen={showCustomerModal}
        customerName={customerName}
        customerPhone={customerPhone}
        onSave={(name, phone) => {
          setCustomerName(name);
          setCustomerPhone(phone);
        }}
        onClose={() => setShowCustomerModal(false)}
      />

      {/* Quick Table Selector Sheet */}
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

      {/* Quick Payment Sheet */}
      {showPaymentSheet && (
        <QuickPaymentSheet
          items={cartItems}
          settings={settings}
          customerName={customerName}
          tableNumber={tableNumber}
          orderType={tableNumber.toLowerCase().includes('takeaway') ? 'TAKEAWAY' : 'DINE_IN'}
          discountPercent={discountPercent}
          discountFlat={discountFlat}
          onBack={() => setShowPaymentSheet(false)}
          onClose={() => setShowPaymentSheet(false)}
          onSuccess={(result) => {
            setShowPaymentSheet(false);
            setSuccessResult(result);
            onRefreshData();
          }}
        />
      )}

      {/* Order Success Modal */}
      {successResult && (
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
          order={successResult?.order || currentPreviewOrder}
          payment={successResult?.payment}
          settings={settings}
          paperSize={settings?.printer_paper_size || '80mm'}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Discard Confirmation Dialog */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Discard Current Order?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will remove all {totalItemCount} items from the cart. This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="py-2.5 rounded-xl font-extrabold text-xs bg-red-600 text-white hover:bg-red-700 transition shadow-xs"
              >
                Yes, Discard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
