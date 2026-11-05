import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Sparkles, Utensils, Pizza, Flame, Coffee, IceCream, Trash2, ArrowRight } from 'lucide-react';
import { Category, MenuItem, Settings, Order, Payment } from '../types';
import { QuickProductCard } from '../components/v2/QuickProductCard';
import { OrderConfirmSheet, QuickCartItem } from '../components/v2/OrderConfirmSheet';
import { QuickPaymentSheet } from '../components/v2/QuickPaymentSheet';
import { OrderSuccessModal } from '../components/v2/OrderSuccessModal';
import { ThermalReceipt } from '../components/ThermalReceipt';

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
  const currency = settings?.currency_symbol || '$';

  // State
  const [selectedCatId, setSelectedCatId] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<QuickCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'TAKEAWAY' | 'DINE_IN'>('TAKEAWAY');
  const [tableNumber, setTableNumber] = useState('');

  // Flow Modals
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [successResult, setSuccessResult] = useState<{ order: Order; payment: Payment } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCat = selectedCatId === 'ALL' || item.category_id === selectedCatId;
      const matchesSearch = !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedCatId, searchQuery]);

  // Cart operations
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

  const handleUpdateQuantity = (itemId: number, delta: number) => {
    setCartItems(prev => {
      return prev.map(it => {
        if (it.menuItem.id === itemId) {
          const newQty = it.quantity + delta;
          return newQty > 0 ? { ...it, quantity: newQty } : null;
        }
        return it;
      }).filter(Boolean) as QuickCartItem[];
    });
  };

  const handleUpdateNotes = (itemId: number, notes: string) => {
    setCartItems(prev => prev.map(it => it.menuItem.id === itemId ? { ...it, notes } : it));
  };

  const handleRemoveItem = (itemId: number) => {
    setCartItems(prev => prev.filter(it => it.menuItem.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setShowConfirmSheet(false);
  };

  // Calculations
  const totalItemCount = cartItems.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = cartItems.reduce((sum, it) => sum + (it.menuItem.price * it.quantity), 0);
  const taxRate = settings?.tax_percentage || 5.0;
  const grandTotal = Math.round((subtotal + (subtotal * (taxRate / 100))) * 100) / 100;

  // Checkout flow handlers
  const handleProceedToPayment = () => {
    setShowConfirmSheet(false);
    setShowPaymentSheet(true);
  };

  const handlePaymentSuccess = (result: { order: Order; payment: Payment }) => {
    setShowPaymentSheet(false);
    setSuccessResult(result);
    onRefreshData();
  };

  const handleStartNewOrder = () => {
    setCartItems([]);
    setCustomerName('');
    setTableNumber('');
    setSuccessResult(null);
    setShowPrintModal(false);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'pizza': return Pizza;
      case 'flame': return Flame;
      case 'coffee': return Coffee;
      case 'icecream': return IceCream;
      default: return Utensils;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Search & Category Filter Header */}
      <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Quick Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tap or search items (e.g. Burger, Pizza)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Clear Cart if has items */}
          {totalItemCount > 0 && (
            <button
              onClick={handleClearCart}
              className="px-2.5 py-2 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-xl border border-slate-700 hover:border-red-800 text-xs font-bold transition flex items-center gap-1"
              title="Reset Order"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Scrollable Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCatId('ALL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              selectedCatId === 'ALL'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            All
          </button>
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                  selectedCatId === cat.id
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid Area */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto pb-24">
        {filteredItems.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-sm">
            <Utensils className="w-8 h-8 mb-2 stroke-1" />
            <p>No products match your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
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

      {/* Floating Sticky Bottom Bar (When cart has items) */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-40">
          <div className="max-w-xl mx-auto bg-slate-900 border-2 border-emerald-500/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-emerald-950/50 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4">
            
            {/* Left Item Count & Total */}
            <div
              onClick={() => setShowConfirmSheet(true)}
              className="flex items-center gap-3 cursor-pointer pl-2 flex-1"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-sm">
                {totalItemCount}
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold block">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in order
                </span>
                <span className="text-base sm:text-lg font-black text-white">
                  {currency}{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Right Confirm & Next Button */}
            <button
              type="button"
              onClick={() => setShowConfirmSheet(true)}
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <span>Confirm Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sheet 1: Order Confirmation & Notes */}
      {showConfirmSheet && (
        <OrderConfirmSheet
          items={cartItems}
          settings={settings}
          customerName={customerName}
          orderType={orderType}
          tableNumber={tableNumber}
          onUpdateCustomerName={setCustomerName}
          onUpdateOrderType={setOrderType}
          onUpdateTableNumber={setTableNumber}
          onUpdateQuantity={handleUpdateQuantity}
          onUpdateNotes={handleUpdateNotes}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onClose={() => setShowConfirmSheet(false)}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      {/* Sheet 2: Payment & Settle */}
      {showPaymentSheet && (
        <QuickPaymentSheet
          items={cartItems}
          settings={settings}
          customerName={customerName}
          orderType={orderType}
          tableNumber={tableNumber}
          onBack={() => {
            setShowPaymentSheet(false);
            setShowConfirmSheet(true);
          }}
          onClose={() => setShowPaymentSheet(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Modal 3: Order Completed / Token Display */}
      {successResult && !showPrintModal && (
        <OrderSuccessModal
          order={successResult.order}
          payment={successResult.payment}
          settings={settings}
          onPrintReceipt={() => setShowPrintModal(true)}
          onNewOrder={handleStartNewOrder}
        />
      )}

      {/* Thermal Receipt Print Preview */}
      {successResult && showPrintModal && (
        <ThermalReceipt
          order={successResult.order}
          settings={settings}
          payment={successResult.payment}
          paperSize={settings.printer_paper_size || '80mm'}
          autoPrint={true}
          onClose={handleStartNewOrder}
        />
      )}
    </div>
  );
};

