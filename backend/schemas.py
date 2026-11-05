from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# Table Schemas
class TableBase(BaseModel):
    number: str
    name: str
    capacity: int = 4
    section: str = "Main Hall"

class TableCreate(TableBase):
    pass

class TableUpdate(BaseModel):
    number: Optional[str] = None
    name: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    section: Optional[str] = None
    active_order_id: Optional[int] = None

class TableResponse(TableBase):
    id: int
    status: str
    active_order_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    icon: str = "Utensils"
    sort_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# MenuItem Schemas
class MenuItemBase(BaseModel):
    category_id: int
    name: str
    description: str = ""
    price: float
    is_available: bool = True
    image_url: str = ""
    sku: str = ""

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None
    sku: Optional[str] = None

class MenuItemResponse(MenuItemBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# OrderItem Schemas
class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = 1
    notes: str = ""

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    menu_item_id: int
    item_name: str
    unit_price: float
    quantity: int
    total_price: float
    notes: str
    status: str
    kot_round: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Order Schemas
class OrderCreate(BaseModel):
    table_id: Optional[int] = None
    order_type: str = "DINE_IN"  # DINE_IN, TAKEAWAY
    customer_name: str = ""
    customer_phone: str = ""
    waiter_name: str = "Staff"
    notes: str = ""
    items: List[OrderItemCreate] = []

class OrderAppendItems(BaseModel):
    waiter_name: Optional[str] = "Staff"
    items: List[OrderItemCreate]

class OrderBillUpdate(BaseModel):
    discount_percent: Optional[float] = None
    discount_amount: Optional[float] = None
    service_charge: Optional[float] = None

class OrderResponse(BaseModel):
    id: int
    order_number: str
    table_id: Optional[int] = None
    order_type: str
    status: str
    subtotal: float
    discount_percent: float
    discount_amount: float
    tax_percent: float
    tax_amount: float
    service_charge: float
    total_amount: float
    customer_name: str
    customer_phone: str
    waiter_name: str
    notes: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

# KOT Schemas
class KOTResponse(BaseModel):
    id: int
    kot_number: str
    order_id: int
    table_id: Optional[int] = None
    table_number: str
    round_number: int
    waiter_name: str
    status: str
    created_at: datetime
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

# Payment Schemas
class PaymentCreate(BaseModel):
    payment_method: str = "CASH"  # CASH, CARD, MOBILE, SPLIT
    amount: float
    amount_tendered: float = 0.0
    change_returned: float = 0.0
    reference: str = ""

class PaymentResponse(BaseModel):
    id: int
    order_id: int
    amount: float
    payment_method: str
    amount_tendered: float
    change_returned: float
    reference: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Quick Checkout Schema (Version 2)
class QuickCheckoutRequest(BaseModel):
    customer_name: str = "Walk-in Guest"
    customer_phone: str = ""
    order_type: str = "TAKEAWAY"
    waiter_name: str = "Cashier"
    notes: str = ""
    items: List[OrderItemCreate]
    payment_method: str = "CASH"
    amount_tendered: float = 0.0
    change_returned: float = 0.0
    reference: str = ""
    discount_percent: float = 0.0
    discount_amount: float = 0.0

class QuickCheckoutResponse(BaseModel):
    order: OrderResponse
    payment: PaymentResponse


# Settings Schemas
class SettingsBase(BaseModel):
    name: str = "Mini Bistro POS"
    tagline: str = "Fresh & Delicious"
    address: str = "123 Food Street, Downtown"
    phone: str = "+1 (555) 019-2834"
    currency_symbol: str = "$"
    tax_percentage: float = 5.0
    service_charge_percentage: float = 0.0
    receipt_header: str = "Welcome to Mini Bistro"
    receipt_footer: str = "Thank you for visiting! Please come again."
    printer_paper_size: str = "80mm"

class SettingsResponse(SettingsBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

