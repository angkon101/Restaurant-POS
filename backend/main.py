import json
from datetime import datetime, date
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

import models
import schemas
from database import engine, get_db, Base
from seed import seed_database

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mini Restaurant POS Backend", version="2.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- WebSocket Hub for Real-Time Sync -----------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event_type: str, data: dict):
        message = json.dumps({"type": event_type, "data": data}, default=str)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for ping/pong or client messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# ----------------- Helper Functions -----------------
def generate_order_number(db: Session) -> str:
    today_str = datetime.now().strftime("%Y%m%d")
    count = db.query(models.Order).filter(
        func.date(models.Order.created_at) == date.today()
    ).count() + 1
    return f"ORD-{today_str}-{count:03d}"

def generate_kot_number(db: Session) -> str:
    count = db.query(models.KOT).filter(
        func.date(models.KOT.created_at) == date.today()
    ).count() + 1
    return f"KOT-{count:03d}"

def recalculate_order_totals(order: models.Order, settings: models.RestaurantSettings):
    subtotal = sum(item.total_price for item in order.items if item.status != "CANCELLED")
    order.subtotal = round(subtotal, 2)
    
    # Calculate discount
    if order.discount_percent > 0:
        order.discount_amount = round(order.subtotal * (order.discount_percent / 100.0), 2)
    
    after_discount = max(0.0, order.subtotal - order.discount_amount)
    
    # Tax removed (0%)
    order.tax_percent = 0.0
    order.tax_amount = 0.0
    
    # Total
    order.total_amount = round(after_discount + order.service_charge, 2)

# ----------------- Settings Endpoints -----------------
@app.get("/api/settings", response_model=schemas.SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.RestaurantSettings).first()
    if not settings:
        seed_database()
        settings = db.query(models.RestaurantSettings).first()
    return settings

@app.put("/api/settings", response_model=schemas.SettingsResponse)
async def update_settings(update_data: schemas.SettingsBase, db: Session = Depends(get_db)):
    settings = db.query(models.RestaurantSettings).first()
    if not settings:
        settings = models.RestaurantSettings()
        db.add(settings)
    for key, value in update_data.model_dump().items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    await manager.broadcast("SETTINGS_UPDATED", {"settings": update_data.model_dump()})
    return settings

# ----------------- Table Endpoints -----------------
@app.get("/api/tables", response_model=List[schemas.TableResponse])
def get_tables(db: Session = Depends(get_db)):
    return db.query(models.Table).order_by(models.Table.number).all()

@app.post("/api/tables", response_model=schemas.TableResponse)
async def create_table(table_in: schemas.TableCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Table).filter(models.Table.number == table_in.number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Table number already exists")
    table = models.Table(**table_in.model_dump())
    db.add(table)
    db.commit()
    db.refresh(table)
    await manager.broadcast("TABLE_CREATED", {"table_id": table.id, "number": table.number})
    return table

@app.put("/api/tables/{table_id}", response_model=schemas.TableResponse)
async def update_table(table_id: int, table_in: schemas.TableUpdate, db: Session = Depends(get_db)):
    table = db.query(models.Table).filter(models.Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    for key, value in table_in.model_dump(exclude_unset=True).items():
        setattr(table, key, value)
    db.commit()
    db.refresh(table)
    await manager.broadcast("TABLE_UPDATED", {"table_id": table.id, "status": table.status})
    return table

@app.post("/api/tables/{source_id}/transfer/{target_id}")
async def transfer_table(source_id: int, target_id: int, db: Session = Depends(get_db)):
    source_table = db.query(models.Table).filter(models.Table.id == source_id).first()
    target_table = db.query(models.Table).filter(models.Table.id == target_id).first()
    
    if not source_table or not target_table:
        raise HTTPException(status_code=404, detail="Source or target table not found")
    if not source_table.active_order_id:
        raise HTTPException(status_code=400, detail="Source table has no active order")
    if target_table.status == "OCCUPIED" and target_table.active_order_id:
        raise HTTPException(status_code=400, detail="Target table is already occupied")
    
    order = db.query(models.Order).filter(models.Order.id == source_table.active_order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Move order to target
    order.table_id = target_table.id
    target_table.active_order_id = order.id
    target_table.status = "OCCUPIED"
    
    source_table.active_order_id = None
    source_table.status = "AVAILABLE"
    
    db.commit()
    await manager.broadcast("TABLE_TRANSFERRED", {
        "from_table": source_table.number,
        "to_table": target_table.number,
        "order_id": order.id
    })
    return {"message": f"Successfully moved order to {target_table.number}"}

# ----------------- Category & Menu Endpoints -----------------
@app.get("/api/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).order_by(models.Category.sort_order).all()

@app.post("/api/categories", response_model=schemas.CategoryResponse)
def create_category(cat_in: schemas.CategoryCreate, db: Session = Depends(get_db)):
    cat = models.Category(**cat_in.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@app.get("/api/menu", response_model=List[schemas.MenuItemResponse])
def get_menu_items(category_id: Optional[int] = None, available_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.MenuItem)
    if category_id:
        query = query.filter(models.MenuItem.category_id == category_id)
    if available_only:
        query = query.filter(models.MenuItem.is_available == True)
    return query.order_by(models.MenuItem.name).all()

@app.post("/api/menu", response_model=schemas.MenuItemResponse)
def create_menu_item(item_in: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    item = models.MenuItem(**item_in.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.put("/api/menu/{item_id}", response_model=schemas.MenuItemResponse)
def update_menu_item(item_id: int, item_in: schemas.MenuItemUpdate, db: Session = Depends(get_db)):
    item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in item_in.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/menu/{item_id}")
def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Menu item deleted"}

# ----------------- Order & KOT Operations -----------------
@app.get("/api/orders/active", response_model=List[schemas.OrderResponse])
def get_active_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).filter(models.Order.status == "ACTIVE").order_by(models.Order.created_at.desc()).all()

@app.get("/api/orders/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.post("/api/orders", response_model=schemas.OrderResponse)
async def create_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    settings = db.query(models.RestaurantSettings).first()
    table = None
    if order_in.table_id:
        table = db.query(models.Table).filter(models.Table.id == order_in.table_id).first()
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        if table.status == "OCCUPIED" and table.active_order_id:
            raise HTTPException(status_code=400, detail="Table already has an active order. Use append items instead.")

    order_number = generate_order_number(db)
    new_order = models.Order(
        order_number=order_number,
        table_id=order_in.table_id,
        order_type=order_in.order_type,
        status="ACTIVE",
        customer_name=order_in.customer_name,
        customer_phone=order_in.customer_phone,
        waiter_name=order_in.waiter_name,
        notes=order_in.notes
    )
    db.add(new_order)
    db.flush()

    # Process items
    kot_items = []
    round_num = 1
    for item_data in order_in.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_data.menu_item_id).first()
        if not menu_item:
            continue
        order_item = models.OrderItem(
            order_id=new_order.id,
            menu_item_id=menu_item.id,
            item_name=menu_item.name,
            unit_price=menu_item.price,
            quantity=item_data.quantity,
            total_price=round(menu_item.price * item_data.quantity, 2),
            notes=item_data.notes,
            status="PENDING",
            kot_round=round_num
        )
        db.add(order_item)
        kot_items.append(order_item)

    db.flush()
    recalculate_order_totals(new_order, settings)

    # Generate KOT if items exist
    if kot_items:
        kot = models.KOT(
            kot_number=generate_kot_number(db),
            order_id=new_order.id,
            table_id=table.id if table else None,
            table_number=table.number if table else "Takeaway",
            round_number=round_num,
            waiter_name=order_in.waiter_name,
            status="NEW"
        )
        db.add(kot)

    # Update Table status
    if table:
        table.status = "OCCUPIED"
        table.active_order_id = new_order.id

    db.commit()
    db.refresh(new_order)

    # Broadcast event
    await manager.broadcast("ORDER_CREATED", {
        "order_id": new_order.id,
        "order_number": new_order.order_number,
        "table_number": table.number if table else "Takeaway",
        "total_amount": new_order.total_amount
    })
    return new_order

@app.post("/api/orders/{order_id}/items", response_model=schemas.OrderResponse)
async def append_order_items(order_id: int, append_data: schemas.OrderAppendItems, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order or order.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Active order not found")
    
    settings = db.query(models.RestaurantSettings).first()
    
    # Calculate next KOT round number
    existing_rounds = [item.kot_round for item in order.items]
    next_round = (max(existing_rounds) if existing_rounds else 0) + 1

    kot_items = []
    for item_data in append_data.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_data.menu_item_id).first()
        if not menu_item:
            continue
        order_item = models.OrderItem(
            order_id=order.id,
            menu_item_id=menu_item.id,
            item_name=menu_item.name,
            unit_price=menu_item.price,
            quantity=item_data.quantity,
            total_price=round(menu_item.price * item_data.quantity, 2),
            notes=item_data.notes,
            status="PENDING",
            kot_round=next_round
        )
        db.add(order_item)
        kot_items.append(order_item)

    db.flush()
    recalculate_order_totals(order, settings)

    table = db.query(models.Table).filter(models.Table.id == order.table_id).first() if order.table_id else None

    # Generate next KOT
    if kot_items:
        kot = models.KOT(
            kot_number=generate_kot_number(db),
            order_id=order.id,
            table_id=table.id if table else None,
            table_number=table.number if table else "Takeaway",
            round_number=next_round,
            waiter_name=append_data.waiter_name or order.waiter_name,
            status="NEW"
        )
        db.add(kot)

    db.commit()
    db.refresh(order)

    await manager.broadcast("ORDER_UPDATED", {
        "order_id": order.id,
        "round_number": next_round,
        "table_number": table.number if table else "Takeaway",
        "new_total": order.total_amount
    })
    return order

@app.put("/api/orders/{order_id}/bill", response_model=schemas.OrderResponse)
async def update_order_bill(order_id: int, bill_in: schemas.OrderBillUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    settings = db.query(models.RestaurantSettings).first()
    if bill_in.discount_percent is not None:
        order.discount_percent = bill_in.discount_percent
    if bill_in.discount_amount is not None:
        order.discount_amount = bill_in.discount_amount
        order.discount_percent = 0.0
    if bill_in.service_charge is not None:
        order.service_charge = bill_in.service_charge

    recalculate_order_totals(order, settings)
    db.commit()
    db.refresh(order)
    
    await manager.broadcast("BILL_UPDATED", {"order_id": order.id, "total": order.total_amount})
    return order

# ----------------- Kitchen Display System (KDS) & KOTs -----------------
@app.get("/api/kots")
def get_kots(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(models.KOT)
    if active_only:
        query = query.filter(models.KOT.status.in_(["NEW", "IN_PROGRESS"]))
    kots = query.order_by(models.KOT.created_at.desc()).all()
    
    result = []
    for k in kots:
        items = db.query(models.OrderItem).filter(
            models.OrderItem.order_id == k.order_id,
            models.OrderItem.kot_round == k.round_number
        ).all()
        result.append({
            "id": k.id,
            "kot_number": k.kot_number,
            "order_id": k.order_id,
            "table_id": k.table_id,
            "table_number": k.table_number,
            "round_number": k.round_number,
            "waiter_name": k.waiter_name,
            "status": k.status,
            "created_at": k.created_at,
            "items": [
                {
                    "id": it.id,
                    "item_name": it.item_name,
                    "quantity": it.quantity,
                    "notes": it.notes,
                    "status": it.status
                } for it in items
            ]
        })
    return result

@app.put("/api/kots/{kot_id}/status")
async def update_kot_status(kot_id: int, status: str, db: Session = Depends(get_db)):
    kot = db.query(models.KOT).filter(models.KOT.id == kot_id).first()
    if not kot:
        raise HTTPException(status_code=404, detail="KOT not found")
    kot.status = status
    
    # Also update associated items status if completing or preparing
    items = db.query(models.OrderItem).filter(
        models.OrderItem.order_id == kot.order_id,
        models.OrderItem.kot_round == kot.round_number
    ).all()
    for item in items:
        if status == "IN_PROGRESS":
            item.status = "COOKING"
        elif status in ["READY", "COMPLETED"]:
            item.status = "READY"
    
    db.commit()
    await manager.broadcast("KOT_STATUS_CHANGED", {"kot_id": kot.id, "status": status})
    return {"message": "KOT status updated", "status": status}

@app.put("/api/order-items/{item_id}/status")
async def update_item_status(item_id: int, status: str, db: Session = Depends(get_db)):
    item = db.query(models.OrderItem).filter(models.OrderItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.status = status
    db.commit()
    await manager.broadcast("ITEM_STATUS_CHANGED", {"item_id": item.id, "status": status})
    return {"message": "Item status updated", "status": status}

# ----------------- Payments & Settlement -----------------
@app.post("/api/orders/{order_id}/pay", response_model=schemas.PaymentResponse)
async def process_payment(order_id: int, payment_in: schemas.PaymentCreate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Order is already completed and paid")

    # Record payment
    payment = models.Payment(
        order_id=order.id,
        amount=payment_in.amount,
        payment_method=payment_in.payment_method,
        amount_tendered=payment_in.amount_tendered,
        change_returned=payment_in.change_returned,
        reference=payment_in.reference
    )
    db.add(payment)

    # Mark order completed
    order.status = "COMPLETED"
    order.completed_at = datetime.utcnow()

    # Free the table
    if order.table_id:
        table = db.query(models.Table).filter(models.Table.id == order.table_id).first()
        if table:
            table.status = "AVAILABLE"
            table.active_order_id = None

    db.commit()
    db.refresh(payment)

    await manager.broadcast("ORDER_PAID", {
        "order_id": order.id,
        "table_id": order.table_id,
        "amount": payment.amount,
        "payment_method": payment.payment_method
    })
    return payment

@app.post("/api/orders/quick-checkout", response_model=schemas.QuickCheckoutResponse)
async def quick_checkout(checkout_in: schemas.QuickCheckoutRequest, db: Session = Depends(get_db)):
    if not checkout_in.items:
        raise HTTPException(status_code=400, detail="Cannot checkout with empty items")

    settings = db.query(models.RestaurantSettings).first()
    order_number = generate_order_number(db)
    new_order = models.Order(
        order_number=order_number,
        table_id=None,
        order_type=checkout_in.order_type,
        status="COMPLETED",
        completed_at=datetime.utcnow(),
        customer_name=checkout_in.customer_name,
        customer_phone=checkout_in.customer_phone,
        waiter_name=checkout_in.waiter_name,
        notes=checkout_in.notes,
        discount_percent=checkout_in.discount_percent,
        discount_amount=checkout_in.discount_amount
    )
    db.add(new_order)
    db.flush()

    # Process items
    kot_items = []
    for item_data in checkout_in.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_data.menu_item_id).first()
        if not menu_item:
            continue
        order_item = models.OrderItem(
            order_id=new_order.id,
            menu_item_id=menu_item.id,
            item_name=menu_item.name,
            unit_price=menu_item.price,
            quantity=item_data.quantity,
            total_price=round(menu_item.price * item_data.quantity, 2),
            notes=item_data.notes,
            status="READY",
            kot_round=1
        )
        db.add(order_item)
        kot_items.append(order_item)

    db.flush()
    recalculate_order_totals(new_order, settings)

    # Generate Kitchen KOT ticket
    if kot_items:
        kot = models.KOT(
            kot_number=generate_kot_number(db),
            order_id=new_order.id,
            table_id=None,
            table_number=f"Counter #{new_order.order_number[-3:]}",
            round_number=1,
            waiter_name=checkout_in.waiter_name,
            status="NEW"
        )
        db.add(kot)

    # Process payment
    amount_paid = new_order.total_amount
    amount_tendered = checkout_in.amount_tendered if checkout_in.payment_method == "CASH" and checkout_in.amount_tendered >= amount_paid else amount_paid
    change_due = round(amount_tendered - amount_paid, 2) if checkout_in.payment_method == "CASH" else 0.0

    payment = models.Payment(
        order_id=new_order.id,
        amount=amount_paid,
        payment_method=checkout_in.payment_method,
        amount_tendered=amount_tendered,
        change_returned=change_due,
        reference=checkout_in.reference
    )
    db.add(payment)

    db.commit()
    db.refresh(new_order)
    db.refresh(payment)

    await manager.broadcast("ORDER_CREATED", {
        "order_id": new_order.id,
        "order_number": new_order.order_number,
        "table_number": "Counter",
        "total_amount": new_order.total_amount
    })
    await manager.broadcast("ORDER_PAID", {
        "order_id": new_order.id,
        "table_id": None,
        "amount": payment.amount,
        "payment_method": payment.payment_method
    })

    return {"order": new_order, "payment": payment}


# ----------------- Analytics & Daily Reports (Z-Report) -----------------
@app.get("/api/reports/today")
def get_today_report(db: Session = Depends(get_db)):
    today_date = date.today()
    completed_orders = db.query(models.Order).filter(
        func.date(models.Order.created_at) == today_date,
        models.Order.status == "COMPLETED"
    ).all()

    total_sales = sum(o.total_amount for o in completed_orders)
    total_tax = sum(o.tax_amount for o in completed_orders)
    total_discount = sum(o.discount_amount for o in completed_orders)
    total_orders = len(completed_orders)
    avg_check = round(total_sales / total_orders, 2) if total_orders > 0 else 0.0

    # Payment breakdown
    payments = db.query(models.Payment).filter(
        func.date(models.Payment.created_at) == today_date
    ).all()
    
    payment_methods = {"CASH": 0.0, "CARD": 0.0, "MOBILE": 0.0, "SPLIT": 0.0}
    for p in payments:
        method = p.payment_method.upper()
        payment_methods[method] = round(payment_methods.get(method, 0.0) + p.amount, 2)

    # Top selling items today
    top_items = db.query(
        models.OrderItem.item_name,
        func.sum(models.OrderItem.quantity).label("total_qty"),
        func.sum(models.OrderItem.total_price).label("total_rev")
    ).join(models.Order).filter(
        func.date(models.Order.created_at) == today_date,
        models.Order.status == "COMPLETED",
        models.OrderItem.status != "CANCELLED"
    ).group_by(models.OrderItem.item_name).order_by(func.sum(models.OrderItem.quantity).desc()).limit(8).all()

    top_items_list = [
        {"item_name": item[0], "quantity": int(item[1]), "revenue": round(float(item[2]), 2)}
        for item in top_items
    ]

    return {
        "date": today_date.strftime("%Y-%m-%d"),
        "total_sales": round(total_sales, 2),
        "total_tax": round(total_tax, 2),
        "total_discount": round(total_discount, 2),
        "total_orders": total_orders,
        "average_check": avg_check,
        "payment_breakdown": payment_methods,
        "top_items": top_items_list
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
