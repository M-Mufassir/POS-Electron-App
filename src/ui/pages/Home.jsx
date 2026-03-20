import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const DEFAULT_QUICK_ACTIONS = [
  {
    title: "Start Billing",
    description: "Open the billing workspace and begin the next invoice immediately.",
    path: "/billing",
    className: "pos-btn-success",
    permission: null,
    badge: "Front Desk",
  },
  {
    title: "Billing History",
    description: "Review invoices and outstanding bills when the counter slows down.",
    path: "/billing/all",
    className: "pos-btn-secondary",
    permission: null,
    badge: "Finance",
  },
  {
    title: "Products",
    description: "Update inventory items, prices, and operational product details.",
    path: "/products",
    className: "pos-btn-primary",
    permission: "manage_products",
    badge: "Catalog",
  },
  {
    title: "Admin Control",
    description: "Create users, assign roles, and manage password access securely.",
    path: "/admin",
    className: "pos-btn-primary",
    permission: "manage_users",
    badge: "Security",
  },
]

const CAPABILITY_ITEMS = [
  {
    title: "Counter Flow",
    description: "Move from product search to checkout without leaving the workspace.",
    permission: null,
  },
  {
    title: "Store Control",
    description: "Maintain products, barcodes, categories, and pricing from one back office.",
    permission: "manage_products",
  },
  {
    title: "Access Control",
    description: "Separate cashier, operations, and admin duties with clean permissions.",
    permission: "manage_users",
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()

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
      <section className="home-shell">
        <div className="home-stage">
          <div className="home-stage-copy">
            <span className="home-kicker">Anver Stores</span>
            <h1 className="home-title">Welcome, {user?.username || "Operator"}.</h1>
            <p className="home-subtitle">
              ZILLIT | POS keeps the landing page short: start billing, review invoices,
              and follow the store workflow from one compact screen.
            </p>

            <div className="home-action-row">
              <button className="pos-btn-success" onClick={() => navigate("/billing")}>
                Open Billing
              </button>
              <button className="pos-btn-secondary" onClick={() => navigate("/billing/all")}>
                Check Bills
              </button>
            </div>

            <div className="home-status-strip">
              <div className="home-status-card">
                <span className="home-status-label">Shop</span>
                <strong>Anver Stores</strong>
              </div>
              <div className="home-status-card">
                <span className="home-status-label">Signed In As</span>
                <strong>{user?.role_name || "User"}</strong>
              </div>
              <div className="home-status-card">
                <span className="home-status-label">Focus</span>
                <strong>{hasPermission("manage_products") ? "Store Control" : "Quick Checkout"}</strong>
              </div>
            </div>
          </div>

          <div className="home-stage-panel">
            <div className="home-stage-panel-header">
              <span className="home-panel-dot" />
              <span>Workflow</span>
            </div>

            <div className="home-highlight-grid">
              <article className="home-highlight-block accent-blue">
                <span className="home-highlight-number">01</span>
                <h3>Open a bill</h3>
                <p>Start checkout fast and keep the counter moving.</p>
              </article>
              <article className="home-highlight-block accent-green">
                <span className="home-highlight-number">02</span>
                <h3>Add products</h3>
                <p>Search items, select units, and complete the sale accurately.</p>
              </article>
              <article className="home-highlight-block accent-amber">
                <span className="home-highlight-number">03</span>
                <h3>Review exceptions</h3>
                <p>Use bills history and store controls when follow-up is needed.</p>
              </article>
            </div>
          </div>
        </div>

        <section className="home-grid">
          <div className="home-card home-card-large">
            <div className="home-card-topline">Quick Actions</div>
            <div className="home-card-heading-row">
              <h2>Go straight to work</h2>
              <p>Use the main routes for Anver Stores without leaving the landing page.</p>
            </div>

            <div className="home-quick-grid">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  type="button"
                  className="home-quick-card"
                  onClick={() => navigate(action.path)}
                >
                  <span className="home-quick-badge">{action.badge}</span>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                  <span className={`home-quick-cta ${action.className}`}>Open</span>
                </button>
              ))}
            </div>
          </div>

          <div className="home-card">
            <div className="home-card-topline">Store Workflow</div>
            <h2>Recommended flow</h2>
            <div className="home-flow-list">
              <div className="home-flow-item">
                <span>1</span>
                <div>
                  <strong>Start with billing</strong>
                  <p>Create the bill and serve the customer first.</p>
                </div>
              </div>
              <div className="home-flow-item">
                <span>2</span>
                <div>
                  <strong>Review bill status</strong>
                  <p>Check open and partial invoices during the shift.</p>
                </div>
              </div>
              <div className="home-flow-item">
                <span>3</span>
                <div>
                  <strong>Maintain store data</strong>
                  <p>Update products, stock setup, and users when required.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-card">
          <div className="home-card-topline">Current Access</div>
          <h2>Your capabilities</h2>
          <div className="home-capability-list">
            {capabilities.map((item) => (
              <article key={item.title} className="home-capability-item">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}