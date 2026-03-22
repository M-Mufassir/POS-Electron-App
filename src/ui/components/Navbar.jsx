import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, hasPermission, logout } = useAuth()

  const menuItems = useMemo(
    () => [
      {
        label: "Home",
        path: "/",
      },
      {
        label: "Billing",
        path: "/billing",
      },
      {
        label: "Products",
        path: "/products",
        permission: "manage_products",
      },
      {
        label: "Categories",
        path: "/categories",
        permission: "manage_catalog",
      },
      {
        label: "Units",
        path: "/units",
        permission: "manage_catalog",
      },
      {
        label: "Barcodes",
        path: "/barcodes",
        permission: "manage_products",
      },
      {
        label: "Admin",
        path: "/admin",
        permission: "manage_users",
      },
    ],
    [],
  )

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/"
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <nav className={`pos-navbar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="navbar-header">
        <div className="navbar-logo">
          <span className="logo-text">ZILLIT | POS</span>
        </div>
        <button
          className="navbar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle navigation"
        >
          Menu
        </button>
      </div>

      <ul className="navbar-menu">
        {menuItems
          .filter((item) => !item.permission || hasPermission(item.permission))
          .map((item) => (
            <li key={item.path}>
              <button
                onClick={() => {
                  navigate(item.path)
                }}
                className={`navbar-link ${isActive(item.path) ? "active" : ""}`}
              >
                <span className="navbar-link-label">{item.label}</span>
              </button>
            </li>
          ))}
      </ul>

      <div className="navbar-footer">
        <div className="navbar-user-meta">
          <div>{user?.username || "User"}</div>
          <div className="navbar-user-role">{user?.role_name || ""}</div>
        </div>
        <button className="navbar-contact-btn" onClick={logout} title="Sign out">
          Sign out
        </button>
        <button
          className="navbar-contact-btn"
          onClick={() => alert("Contact support coming soon")}
          title="Contact Support"
        >
          Contact
        </button>
        <p className="footer-poweredby">Powered by ZILLIT</p>
        <p className="navbar-version">v1.0.0</p>
      </div>
    </nav>
  )
}

export default Navbar
