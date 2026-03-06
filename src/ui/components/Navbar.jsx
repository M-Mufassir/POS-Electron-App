import React, { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    {
      label: "Products",
      path: "/",
    },
    {
      label: "Add Product",
      path: "/products/add",
    },
    {
      label: "Categories",
      path: "/categories",
    },
    {
      label: "Units",
      path: "/units",
    },
    {
      label: "Barcodes",
      path: "/barcodes",
    },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className={`pos-navbar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="navbar-header">
        <div className="navbar-logo">
          <span className="logo-text">MR Solution</span>
        </div>
        <button
          className="navbar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle navigation"
        >
          ≡
        </button>
      </div>

      <ul className="navbar-menu">
        {menuItems.map((item) => (
          <li key={item.path}>
            <button
              onClick={() => {
                navigate(item.path)
                setIsCollapsed(true)
              }}
              className={`navbar-link ${isActive(item.path) ? "active" : ""}`}
            >
              <span className="navbar-link-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="navbar-footer">
        <button
          className="navbar-contact-btn"
          onClick={() => alert("Contact support coming soon")}
          title="Contact Support"
        >
          Contact
        </button>
        <p className="footer-poweredby">Powered by MR Solutions</p>
        <p className="navbar-version">v1.0.0</p>
      </div>
    </nav>
  )
}

export default Navbar
