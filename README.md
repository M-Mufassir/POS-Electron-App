# ZILLIT | POS

A desktop Point-of-Sale application for retail stores, built with **Electron**, **React**, and **SQLite**. One installable app covers counter billing, inventory/catalog management, multi-user access control, and shop branding/theming — all running locally with no external server required.

Powered by MR Solutions.

## Features

### Billing & Sales
- Multi-tab billing workspace — work on several open bills at once
- Barcode scanning (USB scanner or manual entry) with instant product/unit/price resolution
- Product search with keyboard-driven quick-add flow
- Per-unit selling (e.g. sell in `kg` while stock is tracked in `g`) via unit conversion multipliers
- Bill-level discounts (percentage or fixed amount) and a configurable tax rate
- **Split payments** — record CASH/CARD/BANK/ONLINE payments against a bill, with full payment history per invoice
- Stock is deducted automatically the moment a bill goes `PARTIAL` or `PAID`, using base-unit quantity, with a stock-availability check to prevent overselling
- Receipt printing, branded with the shop's name/address/phone/logo and currency symbol from Settings
- Bills List — searchable/filterable invoice history with status, totals, and payment history per bill

### Product Catalog
- **Categories** — full hierarchical tree (unlimited subcategories), with add/edit/deactivate (deactivating a category cascades to its subcategories), and rolled-up product counts per branch
- **Units** — base units and alternate selling units with conversion multipliers, full CRUD
- **Barcodes** — one barcode per product/unit pair (enforced), EAN-13/UPC-A checksum validation, and one-click generation of an internal barcode (GS1 in-store `20`–`29` prefix range) for unbarcoded goods
- Product status (active/inactive) so retired items stop appearing in billing without deleting history

### Admin & Access Control
- Three built-in roles — **Admin**, **Manager**, **Cashier** — each with a centralized permission set shared by the UI and the backend (see [Roles & Permissions](#roles--permissions))
- Admin Dashboard: create users, assign roles, reset passwords, force a password reset on next login
- First-run bootstrap admin account so a brand-new install is usable immediately, without a database seed
- Salted `scrypt` password hashing, with automatic transparent upgrade of any legacy password hash on next successful login
- Login throttling (lockout after 5 failed attempts for 60 seconds)

### Settings & Branding (Admin only)
- Shop identity: name, address, phone, email, logo — shown on the login screen, navbar, footer, and receipts
- Currency symbol and tax rate, applied across billing and receipts
- **Full theme customization**: every themeable color in the app (brand colors, backgrounds, text, borders — 21 variables total) is editable, organized into groups, with live preview
- One-click presets (**Light**, **Dark**, **Ocean**, **Warm**) that fill in the whole palette at once, or a **Custom** mode to fine-tune any individual color
- Theme changes apply instantly across the entire app (navbar, cards, tables, buttons, badges, the Home page) with no restart

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 40 |
| UI | React 19, React Router 7 |
| Styling | Tailwind CSS 3 + custom CSS variables (theme system) |
| Build tooling | Vite 6 |
| Database | SQLite (via `sqlite3`), file-based, no server |
| Packaging | electron-builder (Windows/macOS/Linux) |

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install
```bash
npm install
```

### Development
Runs the Vite dev server and Electron together with hot reload:
```bash
npm run dev
```

### Build the renderer
```bash
npm run build
```

### Package a distributable
```bash
npm run dist:win     # Windows (NSIS installer)
npm run dist:mac     # macOS (dmg)
npm run dist:linux   # Linux (AppImage)
```

### Other scripts
```bash
npm run lint             # ESLint
npm run seed              # Apply schema/migrations against the local database
npm run test:production   # End-to-end smoke test of the core services against a throwaway DB
```

## First-Time Login

On a fresh install (no saved users yet), sign in with the bootstrap admin account:

- **Username:** `Admin`
- **Password:** `12345`

This account only exists while the database has zero saved users, and its password cannot be changed (it isn't a real database row). The recommended first step after installing is:

1. Sign in with the bootstrap admin.
2. Open **Admin Dashboard** and create real, named Admin/Manager/Cashier accounts.
3. Open **Settings** and set the shop name, logo, theme, currency, and tax rate.
4. Distribute the new credentials to staff and continue day-to-day operation with those accounts — the bootstrap admin naturally stops being usable once real users exist.

## Roles & Permissions

| Permission | Admin | Manager | Cashier |
|---|:---:|:---:|:---:|
| Billing / sales | ✅ | ✅ | ✅ |
| Manage bill history | ✅ | ✅ | ✅ |
| Manage products | ✅ | ✅ | ❌ |
| Manage catalog (categories/units) | ✅ | ✅ | ❌ |
| Delete products | ✅ | ❌ | ❌ |
| Delete bill records | ✅ | ❌ | ❌ |
| Manage users & passwords | ✅ | ❌ | ❌ |
| Manage settings & branding | ✅ | ❌ | ❌ |

Permission checks are centralized in `src/shared/authConfig.js` and enforced identically on the UI (hides nav items/pages) and in the Electron backend (rejects unauthorized IPC calls), so the two layers can never drift apart.

## Application Workflow

### Business scenario
ZILLIT | POS is designed for a retail store that needs one desktop workspace for counter billing, invoice tracking, product/barcode management, category and unit management, controlled multi-user access, and shop branding — with cashiers focused purely on sales, managers keeping the catalog accurate, and admins controlling access and shop configuration.

### Daily flow

**Before opening**
1. Admin/Manager confirms products, prices, categories, and active items are correct.
2. Cashier signs in.
3. Billing workspace is ready for the shift.

**During sales**
1. Cashier opens a new bill (or resumes an open/partial one from the sidebar).
2. Products are added by barcode scan or name/code search, with the correct unit and price resolved automatically.
3. A discount is applied if justified, and the (admin-configured) tax rate is applied automatically.
4. Payment is collected — potentially split across multiple methods (cash + card, etc.) — and recorded.
5. The bill is completed; stock is deducted at that point, and a receipt can be printed with the shop's branding.

**During exceptions**
1. Manager checks product, category, or barcode issues from the catalog pages.
2. Admin resets a password if staff can't access the system, or adjusts shop settings/tax rate.
3. Staff review open or partial bills from the Billing Workspace sidebar or the Bills List.

**End of day**
1. Review the Bills List for the day's activity.
2. Inspect outstanding balances on `OPEN`/`PARTIAL` bills.
3. Confirm inventory-sensitive items are accurate ahead of the next shift.

### Catalog structure
- A **product** has a base unit, a base price, and a stock quantity tracked in base units.
- **Alternate units** can be attached to a product with a conversion multiplier (e.g. base unit `g`, alternate unit `kg` = ×1000) — billing always shows the unit the customer is buying while stock stays consistent in base units.
- **Categories** form a tree; a product can be assigned to categories at any depth, not just leaves. Deactivating a parent category deactivates its whole subtree.
- **Barcodes** are attached per `(product, unit)` pair; scanning one in the billing screen resolves the product, unit, and price in one step.

### Billing status lifecycle
- `OPEN` — bill created, nothing paid yet.
- `PARTIAL` — some but not all of the total has been paid; stock has already been deducted.
- `PAID` — fully settled.
- `CANCELLED` — intentionally stopped before any payment was taken (bills with stock already deducted cannot be cancelled — they must be handled as a completed sale).

## Project Structure

```
src/
  electron/            Main process (Electron)
    database/db.js      Schema + lightweight migrations, SQLite connection
    repositories/        Raw SQL per domain (products, categories, units, barcodes, billing, users, settings)
    services/             Business rules, validation, and transactions on top of the repositories
    ipc/                  IPC handler registration + auth/permission guards
    preload.js            contextBridge API exposed to the renderer as window.api
    main.js                App entry point / window creation
  shared/                Code shared between main and renderer (role/permission definitions, theme presets, barcode validation)
  ui/
    context/              React contexts (auth session, app settings/theme)
    pages/                 One folder per feature area (billing, product, category, unit, barcode, admin, auth)
    components/            Reusable UI pieces (Navbar, Footer, Banner, Table, DynamicForm)
    css/                   Theme variables + component stylesheets
    routes/                Route definitions
```

The app follows one consistent path for every feature: **repository → service → IPC handler → preload → React page**, with permissions checked at both the UI and IPC layers.

## Data & Configuration

- Data lives in a local SQLite file — `data/pos.db` next to the project in development, or inside the OS's app-data directory once packaged.
- Override the data location with the `POS_DATA_DIR` environment variable (used by the test suite to run against a disposable database).
- The shop logo is copied into a `branding/` folder alongside the database and served to the renderer as a data URL (the renderer has no direct filesystem access).

## License

Internal/proprietary. Powered by MR Solutions.
