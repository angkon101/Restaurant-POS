import React, { useState, useMemo } from 'react';
import { 
  FileText, X, User, Percent, Trash2, Plus, Minus, AlertTriangle, ChevronUp, ChevronDown
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
  onRefreshData
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

  // Mobile Order Drawer Collapse/Expand
  const [mobileCartExpanded, setMobileCartExpanded] = useState<boolean>(true);

  // Modals / Sheets
  const [showTableModal, setShowTableModal] = useState(false);
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
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden w-full bg-slate-100 font-sans">
      
      {/* ========================================================================= */}
      {/* 1. PRODUCT CATALOG AREA (Left 65-70% on Desktop, Top Flex on Mobile)      */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        
        {/* Horizontal Category Pills Bar (Directly beneath App Bar) */}
        <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                setSelectedCatId('SELECTED');
              }}
              className={`px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition touch-manipulation active:scale-95 ${
                selectedCatId === 'SELECTED'
                  ? 'bg-[#026cb6] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Selected ({totalItemCount})
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.tap();
                setSelectedCatId('ALL');
              }}
              className={`px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition touch-manipulation active:scale-95 ${
                selectedCatId === 'ALL'
                  ? 'bg-[#026cb6] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  haptics.tap();
                  setSelectedCatId(cat.id);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition touch-manipulation active:scale-95 ${
                  selectedCatId === cat.id
                    ? 'bg-[#026cb6] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-bold text-slate-400 shrink-0 hidden sm:inline">
            {filteredItems.length} items
          </span>
        </div>

        {/* Product Cards Grid: 3-column on mobile, 4-5 columns on desktop */}
        <div className="flex-1 p-2 sm:p-3 overflow-y-auto overscroll-contain">
          {filteredItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs sm:text-sm">
              No products found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
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

      {/* ========================================================================= */}
      {/* 2. ORDER BILL SECTION: BOTTOM ON MOBILE APP, RIGHT SIDEBAR ON DESKTOP     */}
      {/* ========================================================================= */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white border-t md:border-t-0 md:border-l border-slate-200 shadow-2xl md:shadow-none shrink-0 z-10 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        
        {/* Order Header Bar (Table #, Customer, and Mobile Collapse Toggle) */}
        <div className="p-2.5 sm:p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs sm:text-sm text-slate-900">Current Order</span>
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
            {/* Live total count pill */}
            {totalItemCount > 0 && (
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
            )}

            {/* Mobile Expand / Collapse Chevron */}
            <button
              type="button"
              onClick={() => setMobileCartExpanded(!mobileCartExpanded)}
              className="md:hidden p-1 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100"
              title={mobileCartExpanded ? 'Collapse Cart' : 'Expand Cart'}
            >
              {mobileCartExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Cart Items List: Scrollable compact list on mobile, full-height on desktop */}
        {mobileCartExpanded && (
          <div className="flex-1 max-h-36 md:max-h-none overflow-y-auto p-2 sm:p-3 space-y-1.5 overscroll-contain">
            {cartItems.length === 0 ? (
              <div className="py-4 md:py-16 flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-1">
                <FileText className="w-6 h-6 text-slate-300 hidden md:block" />
                <p className="font-semibold text-slate-500">Cart is empty</p>
                <p className="text-[11px] text-slate-400">Click food cards to load order</p>
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

                  {/* Steppers & Quick Chef Notes */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                      {COMMON_CHEF_NOTES.slice(0, 2).map((note) => (
                        <button
                          key={note}
                          type="button"
                          onClick={() => handleUpdateItemNote(it.menuItem.id, note)}
                          className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap active:scale-95"
                        >
                          +{note}
                        </button>
                      ))}
                    </div>

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
        )}

        {/* Quick Discount Selector Chips */}
        {cartItems.length > 0 && (
          <div className="px-2.5 sm:px-3 pt-1.5 pb-1 border-t border-slate-200 bg-slate-50/70 shrink-0">
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
                  className={`py-0.5 sm:py-1 rounded text-[10px] font-bold border transition active:scale-95 ${
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
        <div className="p-2.5 sm:p-3 bg-slate-50 border-t border-slate-200 space-y-1 text-xs shrink-0">
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

        {/* Action Buttons: [ Settle & Pay ] and [ Discard ] (No KOT, No Quick Print) */}
        <div className="p-2 sm:p-3 bg-white border-t border-slate-200 grid grid-cols-3 gap-2 shrink-0">
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

      {/* ========================================================================= */}
      {/* 3. MODALS & SHEETS                                                        */}
      {/* ========================================================================= */}

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
                This will clear {totalItemCount} item(s) from Table {tableNumber}.
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

      {/* Payment Sheet */}
      {showPaymentSheet && (
        <QuickPaymentSheet
          items={cartItems}
          settings={settings}
          customerName={customerName || `Table ${tableNumber}`}
          orderType={tableNumber.toLowerCase().includes('takeaway') ? 'TAKEAWAY' : 'DINE_IN'}
          tableNumber={tableNumber}
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
