// src/main.jsx

import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, HashRouter } from "react-router-dom"
import App from "./App"
import { AuthProvider } from "./context/AuthContext"
import { SettingsProvider } from "./context/SettingsContext"

// Import all CSS files
import "./css/index.css"
import "./css/buttons.css"
import "./css/forms.css"
import "./css/tables.css"
import "./css/navbar.css"
import "./css/cards.css"
import "./css/layout.css"
import "./css/utilities.css"
import "./css/billing.css"
import "./css/home.css"

const Router = window.location.protocol === "file:" ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <SettingsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SettingsProvider>
    </Router>
  </React.StrictMode>
)
