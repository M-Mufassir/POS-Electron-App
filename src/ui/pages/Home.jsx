import { useNavigate } from "react-router-dom"

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="pos-container">
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-kicker">POS and ERP Platform</span>
          <h1 className="home-title">MR Solution POS</h1>
          <p className="home-subtitle">
            Fast billing, precise inventory, and multi-role workflows built for modern
            retail operations.
          </p>
          <div className="home-actions">
            <button className="pos-btn-success" onClick={() => navigate("/billing")}>
              Start Billing
            </button>
            <button className="pos-btn-secondary" onClick={() => navigate("/billing/all")}>
              View Bills
            </button>
          </div>
          <div className="home-powered">Powered by MR Solutions</div>
        </div>

        <div className="home-hero-card">
          <div className="home-card-header">Today in one view</div>
          <div className="home-card-grid">
            <div>
              <div className="home-card-title">Quick Billing</div>
              <p>Scan barcodes or search products, apply discounts, and close bills fast.</p>
            </div>
            <div>
              <div className="home-card-title">Smart Inventory</div>
              <p>Quantities are managed in base units with accurate conversions.</p>
            </div>
            <div>
              <div className="home-card-title">Multi Role Access</div>
              <p>Admin, manager, and cashier permissions keep operations controlled.</p>
            </div>
            <div>
              <div className="home-card-title">Receipt Ready</div>
              <p>Print structured receipts the moment bills are completed.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
