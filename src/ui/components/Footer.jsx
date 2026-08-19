import React from "react"
import { useSettings } from "../context/SettingsContext"

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const { settings } = useSettings()

  return (
    <footer className="pos-footer">
      <div className="footer-content">
        <div className="footer-left">
          <p className="footer-copyright">
            © {currentYear} {settings.shop_name || "ZILLIT"}. All rights reserved.
          </p>
          <p className="footer-poweredby">Powered by MR Solutions</p>
        </div>

        <div className="footer-right">
          <button className="footer-contact-btn" onClick={() => alert("Contact support coming soon")}>
            Contact Support
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer