from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from database import Base

class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    capacity = Column(Integer, default=4)
    status = Column(String(20), default="AVAILABLE")  # AVAILABLE, OCCUPIED, BILLED, RESERVED
    section = Column(String(50), default="Main Hall")
    active_order_id = Column(Integer, nullable=True)

    orders = relationship("Order", back_populates="table", foreign_keys="[Order.table_id]")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    icon = Column(String(50), default="Utensils")
    sort_order = Column(Integer, default=0)

    menu_items = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name = Column(String(150), index=True, nullable=False)
    description = Column(Text, default="")
    price = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True)
    image_url = Column(String(300), default="")
    sku = Column(String(50), default="")

    category = relationship("Category", back_populates="menu_items")
    order_items = relationship("OrderItem", back_populates="menu_item")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=True)
    order_type = Column(String(20), default="DINE_IN")  # DINE_IN, TAKEAWAY
    status = Column(String(20), default="ACTIVE")  # ACTIVE, COMPLETED, CANCELLED
    
    subtotal = Column(Float, default=0.0)
    discount_percent = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    tax_percent = Column(Float, default=5.0)
    tax_amount = Column(Float, default=0.0)
    service_charge = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    
    customer_name = Column(String(100), default="")
    customer_phone = Column(String(50), default="")
    waiter_name = Column(String(100), default="Staff")
    notes = Column(Text, default="")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    table = relationship("Table", back_populates="orders", foreign_keys=[table_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    kots = relationship("KOT", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    item_name = Column(String(150), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1)
    total_price = Column(Float, nullable=False)
    notes = Column(String(255), default="")
    status = Column(String(20), default="PENDING")  # PENDING, COOKING, READY, SERVED, CANCELLED
    kot_round = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")

class KOT(Base):
    __tablename__ = "kots"

    id = Column(Integer, primary_key=True, index=True)
    kot_number = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    table_id = Column(Integer, nullable=True)
    table_number = Column(String(50), default="")
    round_number = Column(Integer, default=1)
    waiter_name = Column(String(100), default="")
    status = Column(String(20), default="NEW")  # NEW, IN_PROGRESS, READY, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="kots")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(30), default="CASH")  # CASH, CARD, MOBILE, SPLIT
    amount_tendered = Column(Float, default=0.0)
    change_returned = Column(Float, default=0.0)
    reference = Column(String(100), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="payments")

class RestaurantSettings(Base):
    __tablename__ = "restaurant_settings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Mini Bistro POS")
    tagline = Column(String(150), default="Fresh & Delicious")
    address = Column(String(255), default="123 Food Street, Downtown")
    phone = Column(String(50), default="+1 (555) 019-2834")
    currency_symbol = Column(String(10), default="$")
    tax_percentage = Column(Float, default=5.0)
    service_charge_percentage = Column(Float, default=0.0)
    receipt_header = Column(Text, default="Welcome to Mini Bistro")
    receipt_footer = Column(Text, default="Thank you for visiting! Please come again.")
    printer_paper_size = Column(String(10), default="80mm")  # 80mm or 58mm

