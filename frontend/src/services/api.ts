import {
  Table, Category, MenuItem, Order, KOT, Settings, TodayReport
} from '../types';

const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
export const API_BASE = `http://${host}:8000/api`;
export const WS_URL = `ws://${host}:8000/ws`;

export const api = {
  // Settings
  async getSettings(): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },
  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Tables
  async getTables(): Promise<Table[]> {
    const res = await fetch(`${API_BASE}/tables`);
    if (!res.ok) throw new Error('Failed to fetch tables');
    return res.json();
  },
  async createTable(data: Partial<Table>): Promise<Table> {
    const res = await fetch(`${API_BASE}/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create table');
    return res.json();
  },
  async updateTable(id: number, data: Partial<Table>): Promise<Table> {
    const res = await fetch(`${API_BASE}/tables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update table');
    return res.json();
  },
  async transferTable(sourceId: number, targetId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/tables/${sourceId}/transfer/${targetId}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to transfer table');
    }
    return res.json();
  },

  // Categories & Menu
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },
  async createCategory(data: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },
  async getMenuItems(categoryId?: number): Promise<MenuItem[]> {
    const url = categoryId ? `${API_BASE}/menu?category_id=${categoryId}` : `${API_BASE}/menu`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch menu items');
    return res.json();
  },
  async createMenuItem(data: Partial<MenuItem>): Promise<MenuItem> {
    const res = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create menu item');
    return res.json();
  },
  async updateMenuItem(id: number, data: Partial<MenuItem>): Promise<MenuItem> {
    const res = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update menu item');
    return res.json();
  },
  async deleteMenuItem(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/menu/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete menu item');
  },

  // Orders
  async getActiveOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders/active`);
    if (!res.ok) throw new Error('Failed to fetch active orders');
    return res.json();
  },
  async getOrder(id: number): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`);
    if (!res.ok) throw new Error('Failed to fetch order');
    return res.json();
  },
  async createOrder(data: {
    table_id?: number | null;
    order_type?: string;
    customer_name?: string;
    customer_phone?: string;
    waiter_name?: string;
    notes?: string;
    items: Array<{ menu_item_id: number; quantity: number; notes: string }>;
  }): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create order');
    }
    return res.json();
  },
  async appendOrderItems(orderId: number, data: {
    waiter_name?: string;
    items: Array<{ menu_item_id: number; quantity: number; notes: string }>;
  }): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to append items to order');
    }
    return res.json();
  },
  async updateOrderBill(orderId: number, data: {
    discount_percent?: number;
    discount_amount?: number;
    service_charge?: number;
  }): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/bill`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update bill');
    return res.json();
  },

  // Kitchen Display (KDS) & KOTs
  async getKOTs(activeOnly: boolean = true): Promise<KOT[]> {
    const res = await fetch(`${API_BASE}/kots?active_only=${activeOnly}`);
    if (!res.ok) throw new Error('Failed to fetch KOTs');
    return res.json();
  },
  async updateKOTStatus(kotId: number, status: string): Promise<void> {
    const res = await fetch(`${API_BASE}/kots/${kotId}/status?status=${status}`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to update KOT status');
  },
  async updateOrderItemStatus(itemId: number, status: string): Promise<void> {
    const res = await fetch(`${API_BASE}/order-items/${itemId}/status?status=${status}`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to update item status');
  },

  // Payments & Checkout
  async processPayment(orderId: number, data: {
    amount: number;
    payment_method: string;
    amount_tendered?: number;
    change_returned?: number;
    reference?: string;
  }) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to process payment');
    }
    return res.json();
  },

  async quickCheckout(data: {
    customer_name?: string;
    order_type?: string;
    waiter_name?: string;
    notes?: string;
    items: Array<{ menu_item_id: number; quantity: number; notes: string }>;
    payment_method: string;
    amount_tendered?: number;
    change_returned?: number;
    discount_percent?: number;
    discount_amount?: number;
    reference?: string;
  }): Promise<{ order: Order; payment: any }> {
    const res = await fetch(`${API_BASE}/orders/quick-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to process quick checkout');
    }
    return res.json();
  },


  // Reports
  async getTodayReport(): Promise<TodayReport> {
    const res = await fetch(`${API_BASE}/reports/today`);
    if (!res.ok) throw new Error('Failed to fetch today report');
    return res.json();
  }
};

