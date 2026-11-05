import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { QuickPOSPage } from './pages/QuickPOSPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Category, MenuItem, Settings } from './types';
import { api, WS_URL } from './services/api';
import { sound } from './services/sound';
import { Agentation } from 'agentation';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('POS');
  
  // Application Data States
  const [settings, setSettings] = useState<Settings>({
    id: 1,
    name: "Mijan's Mini Bistro",
    tagline: 'Artisan Burgers, Pizza & Refreshing Drinks',
    address: '42 Culinary Avenue, Downtown Food Street',
    phone: '+1 (555) 789-2041',
    currency_symbol: '$',
    tax_percentage: 5.0,
    service_charge_percentage: 0.0,
    receipt_header: "Welcome to Mijan's Mini Bistro!",
    receipt_footer: 'Thank you for dining with us! Have a wonderful day.',
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
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

      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        settings={settings}
        isWsConnected={isWsConnected}
      />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Simple Order-Based POS */}
        {currentTab === 'POS' && (
          <QuickPOSPage
            categories={categories}
            menuItems={menuItems}
            settings={settings}
            onRefreshData={loadData}
          />
        )}

        {/* Daily Sales & Z-Report */}
        {currentTab === 'REPORTS' && (
          <ReportsPage
            settings={settings}
            paperSize={settings.printer_paper_size || '80mm'}
          />
        )}

        {/* Menu Catalog Admin */}
        {currentTab === 'SETTINGS' && (
          <SettingsPage
            categories={categories}
            menuItems={menuItems}
            currencySymbol={settings.currency_symbol || '$'}
            onRefreshData={loadData}
          />
        )}
      </main>

      {/* Agentation Visual Feedback Tool for Pair-Programming */}
      <Agentation endpoint="http://localhost:4747" appName="Mini Restaurant POS" />
    </div>
  );
};

export default App;
