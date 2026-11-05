import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { MobileNavDrawer } from './components/v2/MobileNavDrawer';
import { QuickPOSPage } from './pages/QuickPOSPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Category, MenuItem, Settings } from './types';
import { api, WS_URL } from './services/api';
import { sound } from './services/sound';
import { Agentation } from 'agentation';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('POS');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('1');
  const [showTableModal, setShowTableModal] = useState(false);

  // Responsive / View Mode State
  const [viewModeOverride, setViewModeOverride] = useState<'AUTO' | 'MOBILE' | 'DESKTOP'>('AUTO');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileViewport = windowWidth < 768;
  const isMobileView = viewModeOverride === 'MOBILE' 
    ? true 
    : viewModeOverride === 'DESKTOP' 
      ? false 
      : isMobileViewport;
  
  // Application Data States
  const [settings, setSettings] = useState<Settings>({
    id: 1,
    name: "Mijan's Restaurant",
    tagline: 'Fresh, Delicious & Quick Everyday',
    address: 'Dhanmondi, Dhaka, Bangladesh',
    phone: '+880 1712-345678',
    currency_symbol: '৳',
    tax_percentage: 0.0,
    service_charge_percentage: 0.0,
    receipt_header: "Welcome to Mijan's Restaurant!",
    receipt_footer: 'Thank you for dining with us! Please come again.',
    printer_paper_size: '80mm'
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // Realtime WebSocket State
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Load initial data from backend
  const loadData = useCallback(async () => {
    try {
      setBackendError(null);
      const [s, c, m] = await Promise.all([
        api.getSettings(),
        api.getCategories(),
        api.getMenuItems()
      ]);
      setSettings(s);
      setCategories(c);
      setMenuItems(m);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setBackendError('Cannot connect to POS backend server. Please verify FastAPI is running on port 8000.');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // WebSocket real-time event listener
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          setIsWsConnected(true);
          setBackendError(null);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { type } = message;

            if (type === 'ORDER_PAID') {
              sound.playCashRegister();
            } else if (type === 'MENU_UPDATED' || type === 'SETTINGS_UPDATED') {
              loadData();
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [loadData]);

  return (
    <div className={`h-[100dvh] w-screen overflow-hidden bg-slate-200 text-slate-800 font-sans flex ${
      isMobileView && !isMobileViewport ? 'justify-center items-center p-0 lg:p-4' : ''
    }`}>
      {/* App Shell Container (Phone mock container if previewing mobile on desktop screen) */}
      <div className={`flex flex-col h-full bg-slate-100 overflow-hidden ${
        isMobileView && !isMobileViewport 
          ? 'w-full max-w-md shadow-2xl rounded-2xl border border-slate-300 ring-8 ring-slate-900/10' 
          : 'w-full'
      }`}>

        {/* Backend Disconnected Notice */}
        {backendError && (
          <div className="bg-red-900/90 text-white text-xs px-4 py-2 text-center font-bold flex items-center justify-center gap-2 no-print border-b border-red-700">
            <span>⚠️ {backendError}</span>
            <button
              onClick={() => loadData()}
              className="underline ml-2 hover:text-amber-300"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Unified App Bar (Adaptive Mobile vs Desktop) */}
        <Navbar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          settings={settings}
          isWsConnected={isWsConnected}
          isMobileView={isMobileView}
          tableNumber={tableNumber}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onOpenTableModal={() => setShowTableModal(true)}
          onToggleViewMode={() => setViewModeOverride(isMobileView ? 'DESKTOP' : 'MOBILE')}
        />

        {/* Main View Area */}
        <main className="flex-1 flex overflow-hidden">
          {/* Order POS Screen */}
          {currentTab === 'POS' && (
            <QuickPOSPage
              categories={categories}
              menuItems={menuItems}
              settings={settings}
              isWsConnected={isWsConnected}
              isMobileView={isMobileView}
              tableNumber={tableNumber}
              setTableNumber={setTableNumber}
              showTableModal={showTableModal}
              setShowTableModal={setShowTableModal}
              onRefreshData={loadData}
              onOpenDrawer={() => setIsDrawerOpen(true)}
            />
          )}

          {/* Daily Sales & Z-Report */}
          {currentTab === 'REPORTS' && (
            <ReportsPage
              settings={settings}
              paperSize={settings.printer_paper_size || '80mm'}
              onBackToPOS={() => setCurrentTab('POS')}
            />
          )}

          {/* Menu Catalog Admin */}
          {currentTab === 'SETTINGS' && (
            <SettingsPage
              categories={categories}
              menuItems={menuItems}
              currencySymbol={settings.currency_symbol || '৳'}
              onRefreshData={loadData}
              onBackToPOS={() => setCurrentTab('POS')}
            />
          )}
        </main>
      </div>

      {/* Mobile Slide-Out Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isDrawerOpen}
        currentTab={currentTab}
        settings={settings}
        isWsConnected={isWsConnected}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsDrawerOpen(false);
        }}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Agentation Visual Feedback Tool for Pair-Programming */}
      <Agentation endpoint="http://localhost:4747" appName="Mini Restaurant POS" />
    </div>
  );
};

export default App;
