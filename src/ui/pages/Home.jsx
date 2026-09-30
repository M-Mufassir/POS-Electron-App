import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useSettings } from "../context/SettingsContext"

const DEFAULT_QUICK_ACTIONS = [
  {
    title: "Start Billing",
    description: "Open the billing workspace and begin the next customer invoice.",
    path: "/billing",
    className: "pos-btn-success",
    permission: null,
    badge: "Front Desk",
  },
  {
    title: "Billing History",
    description: "Review invoices, balances, and payment analysis across all bills.",
    path: "/billing/all",
    className: "pos-btn-secondary",
    permission: null,
    badge: "Finance",
  },
  {
    title: "Products",
    description: "Manage inventory stock, base prices, and product conversions.",
    path: "/products",
    className: "pos-btn-primary",
    permission: "manage_products",
    badge: "Catalog",
  },
  {
    title: "Admin Control",
    description: "Manage system accounts, user roles, security, and shop settings.",
    path: "/admin",
    className: "pos-btn-primary",
    permission: "manage_users",
    badge: "Security",
  },
]

const CAPABILITY_ITEMS = [
  {
    title: "Counter Flow",
    description: "Search products, scan barcodes, adjust units, and complete checkout smoothly.",
    permission: null,
  },
  {
    title: "Store Control",
    description: "Configure product catalog, barcode maps, and unit conversions from one hub.",
    permission: "manage_products",
  },
  {
    title: "Access Control",
    description: "Separate cashier duties, manager permissions, and administrator tools.",
    permission: "manage_users",
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const { settings } = useSettings()
  const shopName = settings.shop_name || "ZILLIT | POS"

  const quickActions = useMemo(
    () =>
      DEFAULT_QUICK_ACTIONS.filter(
        (action) => !action.permission || hasPermission(action.permission),
      ),
    [hasPermission],
  )

  const capabilities = useMemo(
    () =>
      CAPABILITY_ITEMS.filter(
        (item) => !item.permission || hasPermission(item.permission),
      ),
    [hasPermission],
  )

  return (
    <div className="pos-container home-page">
      <div className="home-shell">
        <section className="home-hero-panel">
          <div>
            <span className="home-kicker">{shopName}</span>
            <h1 className="home-title">Welcome, {user?.username || "Operator"}.</h1>
            <p className="home-subtitle">
              Point-of-Sale Control Center: launch billing, review invoices, and manage inventory operations.
            </p>
          </div>

          <div className="home-hero-actions">
            <button className="pos-btn-success" onClick={() => navigate("/billing")}>
              Open Billing
            </button>
            <button className="pos-btn-secondary" onClick={() => navigate("/billing/all")}>
              Billing History
            </button>
          </div>
        </section>

        <section className="home-metrics-grid">
          <div className="home-metric-card">
            <span className="home-metric-label">Store</span>
            <strong>{shopName}</strong>
          </div>
          <div className="home-metric-card">
            <span className="home-metric-label">Signed In As</span>
            <strong>{user?.role_name || "User"}</strong>
          </div>
          <div className="home-metric-card">
            <span className="home-metric-label">Operational Mode</span>
            <strong>{hasPermission("manage_products") ? "Full Store Control" : "Counter Checkout"}</strong>
          </div>
          <div className="home-metric-card">
            <span className="home-metric-label">Terminal Status</span>
            <strong>Online & Active</strong>
          </div>
        </section>

        <section className="pos-card">
          <div className="pos-card-header">
            <h3>Quick Operations</h3>
            <p>Access the main modules for {shopName} directly.</p>
          </div>
          <div className="home-quick-grid">
            {quickActions.map((action) => (
              <button
                key={action.path}
                type="button"
                className="home-quick-card"
                onClick={() => navigate(action.path)}
              >
                <div className="home-quick-top">
                  <span className="home-quick-badge">{action.badge}</span>
                </div>
                <strong>{action.title}</strong>
                <p>{action.description}</p>
                <span className={`home-quick-cta ${action.className}`}>Open</span>
              </button>
            ))}
          </div>
        </section>

        <section className="home-columns-grid">
          <div className="pos-card">
            <div className="pos-card-header">
              <h3>Store Workflow</h3>
              <p>Recommended sequence for shift operations</p>
            </div>
            <div className="home-flow-list">
              <div className="home-flow-item">
                <span className="home-flow-number">1</span>
                <div>
                  <strong>Start with billing</strong>
                  <p>Open or resume the customer bill and begin scanning items.</p>
                </div>
              </div>
              <div className="home-flow-item">
                <span className="home-flow-number">2</span>
                <div>
                  <strong>Add products & manage units</strong>
                  <p>Search catalog, select unit packaging, and enter discounts accurately.</p>
                </div>
              </div>
              <div className="home-flow-item">
                <span className="home-flow-number">3</span>
                <div>
                  <strong>Record payment & review status</strong>
                  <p>Record partial or full payment, print receipt, and review invoices in Analysis.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pos-card">
            <div className="pos-card-header">
              <h3>System Capabilities</h3>
              <p>Available features for your role ({user?.role_name || "User"})</p>
            </div>
            <div className="home-capability-list">
              {capabilities.map((item) => (
                <article key={item.title} className="home-capability-item">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}