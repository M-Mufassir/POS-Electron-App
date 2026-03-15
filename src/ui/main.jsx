// src/main.jsx

import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import { AuthProvider } from "./context/AuthContext"

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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
