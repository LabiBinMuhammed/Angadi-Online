# 🛍️ Angadi Online — Hyperlocal Multi-Vendor Marketplace

**Angadi** is an end-to-end multi-vendor community commerce platform built for hyperlocal merchants, customers, and delivery logistics across South Asian and multilingual markets.

---

## 🏛️ Project Architecture

The repository is structured as a unified monorepo containing three core pillars:

```
ANGADI/
├── web/                  # Next.js 16 (React 19, TypeScript) Web Portal & PWA (+ Capacitor Mobile Wrappers)
├── mobile/               # Flutter (Dart) Native Mobile Application (iOS / Android / Web)
├── supabase/             # PostgreSQL Database Schemas, RLS Policies, RPC Functions & Seeds
├── Angadi_Master_Test_Cases.md  # System-wide QA validation & verification suite
└── package.json          # Monorepo orchestration scripts
```

---

## 🌟 Key Features

1. **Multilingual First**: Native support for **Malayalam (മലയാളം)**, **English**, **Hindi (हिन्दी)**, and **Arabic (العربية)** with RTL support and real-time localized search.
2. **Customer Portal**:
   - Location-aware shop and product discovery.
   - Immutable checkout order snapshotting (`order_addresses`).
   - Replacement requests, item reviews, and store loyalty stars/scratch cards.
3. **Vendor Management**:
   - Multi-owner shop collaboration (`shop_owners`).
   - Live order processing, batch delivery dispatch, item catalog & variant pricing.
   - Credit ledger, customer repayments, and commission settlement tracking.
4. **Admin Console**:
   - Platform-wide shop billing, dispute resolution, category & unit group management.
   - Global demo catalogs and broadcast notification dispatcher.
5. **Robust Security**:
   - Multi-tenant Row-Level Security (RLS) across 31+ PostgreSQL tables.
   - Role-based route middleware protecting customer, vendor, and admin surfaces.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v24.x`
- **npm**: `v10+`
- **Flutter SDK**: (for native mobile development)

---

### Running the Web Application

1. **Install dependencies**:
   ```bash
   npm --prefix web install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` inside `web/` (or update existing `web/.env.local`):
   ```bash
   cp web/.env.example web/.env.local
   ```

3. **Start the Development Server**:
   ```bash
   # From root:
   npm run dev
   # Or inside web directory:
   cd web && npm run dev
   ```

4. **Access the portal**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Running Database Migrations
Refer to [`supabase/README.md`](supabase/README.md) for full instructions on running SQL migrations, triggers, and seed scripts.

---

### Running the Mobile Application
```bash
cd mobile
flutter pub get
flutter run
```

---

## 📜 Available Scripts (Root)

- `npm run dev` / `npm run web:dev`: Starts Next.js development server.
- `npm run build` / `npm run web:build`: Builds production Next.js application.
- `npm run lint` / `npm run web:lint`: Runs ESLint checks.
- `npm run analyze`: Runs automated codebase discovery and entity mapping.
- `npm run test:qa`: Executes full-system QA verification tests.
