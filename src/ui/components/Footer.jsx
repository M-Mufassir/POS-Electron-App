import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="pos-footer">
      <div className="footer-content">
        <div className="footer-left">
          <p className="footer-copyright">
            © {currentYear} MR Solution. All rights reserved.
          </p>
        </div>

        <div className="footer-right">
          <button className="footer-contact-btn" onClick={() => alert("Contact support coming soon")}>
            Contact Support
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
