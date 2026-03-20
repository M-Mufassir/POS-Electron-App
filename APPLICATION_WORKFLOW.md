# ZILLIT | POS Application Workflow

## 1. Business Scenario

ZILLIT | POS is designed for a retail store such as Anver Stores that needs one desktop workspace for:

- counter billing
- invoice tracking
- product and barcode management
- unit and category management
- controlled multi-user access

The business expectation is simple:

1. cashiers create and complete bills quickly
2. managers keep the product catalog, units, and barcodes accurate
3. admins control user access and passwords
4. billing activity updates product stock when a bill becomes partial or paid

This makes the application suitable for a store where the same system must support front-desk sales and back-office control without mixing responsibilities.

## 2. Roles And Responsibilities

### Admin

- logs in with full access
- creates users
- assigns roles
- resets passwords
- manages products, categories, units, and barcodes

### Manager

- manages products
- manages categories and units
- manages barcodes
- supports inventory correctness
- does not manage users or passwords

### Cashier

- works mainly with billing
- can create and process bills
- can review bill history where permitted by the current app flow
- does not manage catalog structure or users

## 3. First-Time Startup Workflow

When the database has no saved users:

- the application exposes the default bootstrap admin account
- username: `Admin`
- password: `12345`

This exists only to start the system safely for the first time.

Recommended first-time process:

1. sign in with the default admin
2. open the Admin Dashboard
3. create real named users for Admin, Manager, and Cashier roles
4. distribute those credentials to staff
5. continue daily operation using saved users

## 4. Authentication And Authorization Flow

### Login

- the app checks whether saved users exist
- if no saved users exist, the default admin can log in
- if saved users exist, normal saved credentials are used
- successful login lands the user on the Home page

### Password Reset

- users flagged for password reset must change password before entering the app
- admins can reset other users' passwords
- the bootstrap admin cannot change its hardcoded password because it is not a persisted database user

### Permission Model

- Admin: full control
- Manager: catalog and product control
- Cashier: sales workflow only

The UI and Electron backend now use the same centralized role-permission definition so access rules stay consistent.

## 5. Home Page Workflow

The Home page is the operational landing page after login.

It is meant to answer these questions immediately:

- who is signed in
- what role is active
- what the user can do next
- what the main shift priorities are

It provides:

- role-aware quick actions
- operational summaries
- direct entry into billing, bills, products, and admin work

## 6. Product Management Workflow

The Products Inventory page is the main stock master-data screen.

Typical workflow:

1. add a product with code, name, base unit, base price, and stock
2. assign categories
3. assign extra selling units and conversion multipliers
4. attach barcodes for selling units
5. activate or deactivate products as needed

Operational goals:

- one clear searchable product list
- fast product editing
- stock and status visibility
- accurate unit-based selling logic

## 7. Category And Unit Workflow

### Categories

Used to group products for reporting, organization, and browsing.

### Units

Used to support base-unit stock control and alternate selling units.

Example:

- base unit: kilogram
- selling unit: gram
- conversion multiplier defines the relationship

This is important because billing uses the selected unit while stock is controlled in base quantity.

## 8. Barcode Workflow

Barcodes connect a product and a specific unit.

This allows:

- scanning a barcode directly in billing
- automatically resolving the product
- determining the correct unit and sell price

This is critical in real POS work because staff should not need to search for every sale manually.

## 9. Billing Workflow

The Billing Workspace is the core transaction area.

### Open Bill Lifecycle

1. create a new bill
2. optionally enter customer name
3. add products by barcode or product search
4. choose unit and quantity
5. apply discount if needed
6. save the bill
7. complete the bill when payment is finalized

### Status Logic

- `OPEN`: bill created but not paid
- `PARTIAL`: partially paid
- `PAID`: fully paid or completed
- `CANCELLED`: intentionally stopped

### Stock Logic

When a bill becomes partial or paid for the first time:

- inventory is deducted from product stock
- stock uses base-unit quantity

This prevents stock from being deducted repeatedly for the same bill.

### Billing UX Expectations

The billing screen should support:

- quick search of open bills
- quick creation of new bills
- product search and barcode resolution
- visible totals and balance
- receipt printing after completion

## 10. Bills History Workflow

The All Bills page is the review and audit screen.

It supports:

- searching historical invoices
- filtering by status
- reviewing financial summaries
- opening bill details
- deleting incorrect or test data where permitted

Business value:

- lets supervisors verify sales activity
- lets staff inspect invoice totals and payment state
- gives management visibility into outstanding balances

## 11. Recommended Daily Operating Scenario

### Before Opening

1. admin or manager confirms products, prices, and active items
2. cashier signs in
3. billing workspace is ready for the shift

### During Sales

1. cashier creates bills continuously
2. products are added by barcode or search
3. discounts are applied when justified
4. payment is collected
5. bill is completed and optionally printed

### During Exceptions

1. manager checks product or barcode issues
2. admin resets passwords if staff cannot access the system
3. staff review open or partial bills from the billing workspace and bills list

### End Of Day

1. review all bills
2. inspect outstanding balances
3. confirm partial and open invoices
4. verify inventory-sensitive items if needed

## 12. Practical Business Rules

For best operation, the store should follow these rules:

- only admins create users
- only trusted roles manage catalog data
- cashiers should not edit product structure
- products should have correct base units before alternate units are added
- barcodes should always be tied to the correct unit
- inactive products should not be used for new selling activity
- open and partial bills should be reviewed regularly

## 13. Current Application Strengths

- centralized authentication and authorization
- first-time bootstrap admin flow
- role-aware landing page
- searchable product and bill workflows
- billing with barcode and unit support
- summary-driven operational screens

## 14. Future Business Improvements

Recommended next business-grade upgrades:

- customer master records
- supplier and purchase workflows
- low-stock alerts
- refund and return handling
- cashier shift closing reports
- sales dashboards and profit reporting
- receipt printer configuration and templates
- audit log for admin actions

## 15. Final Operating Model

The intended business model of this application is:

- Home page for direction
- Billing Workspace for transactions
- Product, Category, Unit, and Barcode pages for operational control
- Bills List for audit and review
- Admin Dashboard for user governance

That separation gives the store a realistic POS workflow:

- sell fast
- control stock accurately
- keep user access clean
- review billing outcomes with confidence
