import { useEffect, useState } from "react"

function AddUnitCard({ isOpen, onClose, onSubmit, saving }) {
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [description, setDescription] = useState("")
  const [baseMultiplier, setBaseMultiplier] = useState("1")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return

    setName("")
    setSymbol("")
    setDescription("")
    setBaseMultiplier("1")
    setError("")
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose, saving])

  if (!isOpen) return null

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget && !saving) {
      onClose()
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedSymbol = symbol.trim()
    const trimmedDescription = description.trim()
    const parsedMultiplier = Number(baseMultiplier)

    if (!trimmedName || !trimmedSymbol) {
      setError("Unit name and symbol are required.")
      return
    }
    if (!Number.isFinite(parsedMultiplier) || parsedMultiplier <= 0) {
      setError("Base multiplier must be a positive number.")
      return
    }

    setError("")

    try {
      await onSubmit({
        name: trimmedName,
        symbol: trimmedSymbol,
        description: trimmedDescription,
        base_multiplier: parsedMultiplier,
      })
    } catch (submitError) {
      setError(submitError?.message || "Failed to add unit.")
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-slate-800">Add New Unit</h3>
        <p className="text-sm text-slate-500 mt-1 mb-5">
          Create a unit for product pricing and conversions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="pos-form-group">
            <label htmlFor="unit-name" className="pos-label">Name</label>
            <input
              id="unit-name"
              type="text"
              className="pos-input"
              placeholder="Unit name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="pos-form-group">
            <label htmlFor="unit-symbol" className="pos-label">Symbol</label>
            <input
              id="unit-symbol"
              type="text"
              className="pos-input"
              placeholder="e.g. kg, l, pcs"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="pos-form-group">
            <label htmlFor="unit-base-multiplier" className="pos-label">Base Multiplier</label>
            <input
              id="unit-base-multiplier"
              type="number"
              className="pos-input"
              min="0.0001"
              step="0.0001"
              value={baseMultiplier}
              onChange={(event) => setBaseMultiplier(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="pos-form-group">
            <label htmlFor="unit-description" className="pos-label">Description (optional)</label>
            <textarea
              id="unit-description"
              className="pos-input"
              rows={3}
              placeholder="Describe this unit"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={saving}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="pos-btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="pos-btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Unit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddUnitCard
