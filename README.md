# 🍽️ Mini Restaurant POS (Dine-In Focus with KOT & Thermal Printing)

A modern, fast, and responsive Point of Sale (POS) system engineered for mini restaurants, cafes, and bistros. Built with **FastAPI (Python 3.11)**, **SQLite**, **WebSockets**, and **React 18 (TypeScript + Vite + Tailwind CSS)**.

---

## ✨ Features

- **Interactive Table & Floor Management**: Real-time visual floor grid with live status indicators (`Available`, `Occupied`, `Billed`, `Reserved`), active check balance, and order duration timer.
- **Table Transfer**: Seamlessly move active dining guests from one table to another.
- **Menu Catalog & Fast Cart**: Categorized menu with instant search, item notes/special requests (e.g., "extra sauce", "no onions"), and fast quantity adjustments.
- **Multi-Round Ordering & Kitchen Order Tickets (KOT)**: Take appetizers first, add mains later; each round creates an incremental KOT with round tracking.
- **Kitchen Display System (KDS)**: Live kitchen screen for chefs with ticket lifecycle (`Pending` ➔ `Preparing` ➔ `Ready`) and audible notification chimes.
- **Thermal Receipt & KOT Printing**: Pixel-perfect monospace thermal printer layout optimized for both **58mm** and **80mm** paper rolls.
- **Billing & Flexible Payments**: Supports Cash (with instant change calculation), Card, Mobile Wallets (bKash/Nagad/QR), and Split payments.
- **Daily Analytics & Z-Report**: Real-time daily sales reconciliation, category/item sales performance, and payment breakdown.
- **Local Network Ready**: Access the POS from any counter PC, Android/iPad tablet, or mobile phone on the restaurant's local Wi-Fi.

---

## 🏗️ Project Architecture

```
Restaurant-POS/
├── backend/                  # FastAPI Python backend
│   ├── database.py           # SQLite connection & session management
│   ├── models.py             # SQLAlchemy 2.0 ORM models
│   ├── schemas.py            # Pydantic v2 validation schemas
│   ├── seed.py               # Sample tables, categories & menu items
│   ├── main.py               # REST API & WebSocket real-time hub
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Vite + React 18 + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/       # Floor map, Cart, Modals, Receipt, KDS
│   │   ├── pages/            # POS, Kitchen, Reports, Settings
│   │   ├── types/            # TypeScript interfaces
│   │   ├── services/         # API client & WebSocket listener
│   │   ├── App.tsx           # Main application routing & layout
│   │   └── main.tsx          # React DOM entry
│   ├── package.json
│   └── vite.config.ts
│
├── run.bat                   # 1-Click launcher for Windows
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python seed.py               # Seeds sample tables, categories and delicious menu items
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
API Documentation will be available at: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --host
```
The POS interface will be live at: `http://localhost:5173`

---

## 🖨️ Thermal Printer Setup
This POS features native CSS `@media print` rules calibrated for standard 58mm and 80mm ESC/POS thermal receipt printers. When clicking **"Print Bill"** or **"Print KOT"**, the system automatically prepares a clean receipt with zero unnecessary margins.
