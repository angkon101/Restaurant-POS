export interface Table {
  id: number;
  number: string;
  name: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILLED' | 'RESERVED';
  section: string;
  active_order_id?: number | null;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  image_url?: string;
  sku?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  item_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  notes: string;
  status: 'PENDING' | 'COOKING' | 'READY' | 'SERVED' | 'CANCELLED';
  kot_round: number;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  table_id?: number | null;
  order_type: 'DINE_IN' | 'TAKEAWAY';
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  waiter_name: string;
  notes?: string;
  created_at: string;
  completed_at?: string | null;
  items: OrderItem[];
}

export interface KOTItem {
  id: number;
  item_name: string;
  quantity: number;
  notes: string;
  status: string;
}

export interface KOT {
  id: number;
  kot_number: string;
  order_id: number;
  table_id?: number | null;
  table_number: string;
  round_number: number;
  waiter_name: string;
  status: 'NEW' | 'IN_PROGRESS' | 'READY' | 'COMPLETED';
  created_at: string;
  items: KOTItem[];
}

export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  payment_method: 'CASH' | 'CARD' | 'MOBILE' | 'SPLIT';
  amount_tendered: number;
  change_returned: number;
  reference?: string;
  created_at: string;
}

export interface Settings {
  id: number;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  currency_symbol: string;
  tax_percentage: number;
  service_charge_percentage: number;
  receipt_header: string;
  receipt_footer: string;
  printer_paper_size: '80mm' | '58mm';
}

export interface TopItemReport {
  item_name: string;
  quantity: number;
  revenue: number;
}

export interface TodayReport {
  date: string;
  total_sales: number;
  total_tax: number;
  total_discount: number;
  total_orders: number;
  average_check: number;
  payment_breakdown: {
    CASH: number;
    CARD: number;
    MOBILE: number;
    SPLIT: number;
    [key: string]: number;
  };
  top_items: TopItemReport[];
}
