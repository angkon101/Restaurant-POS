import React, { useState } from 'react';
import { LayoutGrid, UtensilsCrossed, Plus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Table, Category, MenuItem, Order, Settings, Payment } from '../types';
import { TableCard } from '../components/TableCard';
import { MenuCatalog } from '../components/MenuCatalog';
import { OrderCart, CartItem } from '../components/OrderCart';
import { PaymentModal } from '../components/PaymentModal';
import { TransferTableModal } from '../components/TransferTableModal';
import { ThermalReceipt } from '../components/ThermalReceipt';

interface POSPageProps {
  tables: Table[];
  categories: Category[];
  menuItems: MenuItem[];
  activeOrders: Order[];
  settings: Settings;
  onRefreshData: () => void;
}

export const POSPage: React.FC<POSPageProps> = ({
  tables,
  categories,
  menuItems,
  activeOrders,
  settings,
  onRefreshData
}) => {
  const currency = settings?.currency_symbol || '$';
  
  // View states
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [isOrderingMode, setIsOrderingMode] = useState(false);
  const [isTakeawayOrder, setIsTakeawayOrder] = useState(false);

  // Cart staged items for round
  const [stagedItems, setStagedItems] = useState<CartItem[]>([]);

  // Modals
  const [orderForPayment, setOrderForPayment] = useState<Order | null>(null);
  const [tableForTransfer, setTableForTransfer] = useState<Table | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);

  // Sections
  const sections = ['ALL', ...Array.from(new Set(tables.map(t => t.section)))];

  const filteredTables = tables.filter(t => {
    if (selectedSection === 'ALL') return true;
    return t.section === selectedSection;
  });

  const getTableActiveOrder = (table: Table): Order | null => {
    return activeOrders.find(o => o.table_id === table.id && o.status === 'ACTIVE') || null;
  };

  const handleSelectTable = (table: Table) => {
    setActiveTable(table);
    setIsTakeawayOrder(false);
    setIsOrderingMode(true);
    setStagedItems([]);
  };

  const handleStartTakeaway = () => {
    setActiveTable(null);
    setIsTakeawayOrder(true);
    setIsOrderingMode(true);
    setStagedItems([]);
  };

  const handleCloseOrdering = () => {
    setIsOrderingMode(false);
    setActiveTable(null);
    setIsTakeawayOrder(false);
    setStagedItems([]);
  };

  // Cart operations
  const handleAddItemToCart = (item: MenuItem, notes: string = '') => {
    setStagedItems(prev => {
      const existingIdx = prev.findIndex(it => it.menuItem.id === item.id && it.notes === notes);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      }
      return [...prev, { menuItem: item, quantity: 1, notes }];
    });
  };

  const handleUpdateQuantity = (menuItemId: number, delta: number) => {
    setStagedItems(prev => {
      return prev.map(it => {
        if (it.menuItem.id === menuItemId) {
          const newQty = it.quantity + delta;
          return newQty > 0 ? { ...it, quantity: newQty } : null;
        }
        return it;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (menuItemId: number) => {
    setStagedItems(prev => prev.filter(it => it.menuItem.id !== menuItemId));
  };

  const handleOrderSaved = () => {
    onRefreshData();
  };

  const handleOpenPay = (_table: Table, order: Order) => {
    setOrderForPayment(order);
  };

  const handlePaymentSuccess = (payment: Payment) => {
    setLastPayment(payment);
    const completedOrder = activeOrders.find(o => o.id === payment.order_id);
    if (completedOrder) {
      setReceiptOrder(completedOrder);
    }
    setOrderForPayment(null);
    setIsOrderingMode(false);
    onRefreshData();
  };

  const currentActiveOrder = activeTable ? getTableActiveOrder(activeTable) : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* If in Ordering Mode (split screen: Menu Catalog + Order Cart) */}
      {isOrderingMode ? (
        <div className="flex-1 flex flex-col h-full">
          {/* Subheader bar to go back */}
          <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <button
              onClick={handleCloseOrdering}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Floor Map
            </button>
            <div className="text-center">
              <span className="text-sm font-bold text-white">
                {activeTable ? `Ordering for Table: ${activeTable.number}` : 'Takeaway / Quick Order'}
              </span>
            </div>
            <div className="w-24"></div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <MenuCatalog
                categories={categories}
                menuItems={menuItems}
                currencySymbol={currency}
                onAddItem={handleAddItemToCart}
              />
            </div>
            <OrderCart
              selectedTable={activeTable}
              activeOrder={currentActiveOrder}
              stagedItems={stagedItems}
              settings={settings}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={() => setStagedItems([])}
              onOrderSaved={handleOrderSaved}
              onOpenCheckout={(ord) => setOrderForPayment(ord)}
              onClose={handleCloseOrdering}
            />
          </div>
        </div>
      ) : (
        /* Floor Map View */
        <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6">
          {/* Top Floor Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Restaurant Floor & Tables</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {tables.filter(t => t.status === 'AVAILABLE').length} of {tables.length} tables available
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStartTakeaway}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-950/40"
              >
                <ShoppingBag className="w-4 h-4" />
                Takeaway / Counter Order
              </button>
            </div>
          </div>

          {/* Section Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  selectedSection === sec
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {sec === 'ALL' ? 'All Sections' : sec}
              </button>
            ))}
          </div>

          {/* Table Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredTables.map((table) => {
              const activeOrder = getTableActiveOrder(table);
              return (
                <TableCard
                  key={table.id}
                  table={table}
                  activeOrder={activeOrder}
                  currencySymbol={currency}
                  onSelect={handleSelectTable}
                  onPay={handleOpenPay}
                  onTransfer={(t) => setTableForTransfer(t)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Payment / Checkout Modal */}
      {orderForPayment && (
        <PaymentModal
          order={orderForPayment}
          settings={settings}
          onClose={() => setOrderForPayment(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Transfer Table Modal */}
      {tableForTransfer && (
        <TransferTableModal
          sourceTable={tableForTransfer}
          tables={tables}
          onClose={() => setTableForTransfer(null)}
          onSuccess={() => {
            setTableForTransfer(null);
            onRefreshData();
          }}
        />
      )}

      {/* Thermal Receipt Print Modal */}
      {receiptOrder && (
        <ThermalReceipt
          order={receiptOrder}
          settings={settings}
          payment={lastPayment}
          paperSize={settings.printer_paper_size || '80mm'}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
};

