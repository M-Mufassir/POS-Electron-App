import { useEffect, useState } from "react"
import { useSettings } from "../context/SettingsContext"

const MinimizeIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
  </svg>
)

const MaximizeIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" />
  </svg>
)

const RestoreIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <rect x="2.5" y="0.5" width="7" height="7" fill="none" stroke="currentColor" />
    <path d="M0.5 2.5V9.5H7.5" fill="none" stroke="currentColor" />
  </svg>
)

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <path d="M0.5 0.5L9.5 9.5M9.5 0.5L0.5 9.5" stroke="currentColor" strokeWidth="1.1" />
  </svg>
)

export default function TitleBar() {
  const { logoDataUrl } = useSettings()
  const [isMaximized, setIsMaximized] = useState(true)

  useEffect(() => {
    let unsubscribe
    window.api.isWindowMaximized().then(setIsMaximized)
    unsubscribe = window.api.onWindowMaximizedChanged(setIsMaximized)
    return () => unsubscribe?.()
  }, [])

  return (
    <header className="app-titlebar">
      <div className="app-titlebar-drag">
        {logoDataUrl ? <img src={logoDataUrl} alt="" className="app-titlebar-logo" /> : null}
        <span className="app-titlebar-title">Inventory System</span>
      </div>

      <div className="app-titlebar-controls">
        <button
          type="button"
          className="titlebar-btn"
          aria-label="Minimize"
          onClick={() => window.api.minimizeWindow()}
        >
          <MinimizeIcon />
        </button>
        <button
          type="button"
          className="titlebar-btn"
          aria-label={isMaximized ? "Restore" : "Maximize"}
          onClick={() => window.api.toggleMaximizeWindow()}
        >
          {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>
        <button
          type="button"
          className="titlebar-btn titlebar-btn-close"
          aria-label="Close"
          onClick={() => window.api.closeWindow()}
        >
          <CloseIcon />
        </button>
      </div>
    </header>
  )
}
