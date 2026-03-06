import React, { useMemo, useState } from "react"

export default function UnitSection({
  units = [],
  selectedUnits = [],
  onChange,
}) {
  const [showEditor, setShowEditor] = useState(false)

  const selectedUnitMap = useMemo(() => {
    const map = new Map()
    selectedUnits.forEach((entry) => {
      map.set(entry.unit_id, entry)
    })
    return map
  }, [selectedUnits])

  const toggleUnit = (unitId) => {
    const exists = selectedUnitMap.has(unitId)
    if (exists) {
      onChange(selectedUnits.filter((entry) => entry.unit_id !== unitId))
      return
    }
    onChange([...selectedUnits, { unit_id: unitId, conversion_multiplier: 1 }])
  }

  const updateUnitMultiplier = (unitId, value) => {
    const parsedValue = Number(value)
    onChange(
      selectedUnits.map((entry) =>
        entry.unit_id === unitId
          ? {
              ...entry,
              conversion_multiplier: Number.isNaN(parsedValue) ? 1 : parsedValue,
            }
          : entry,
      ),
    )
  }

  return (
    <div className="pos-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="pos-section-title text-base">Units</h3>
        <button
          type="button"
          className="pos-btn-secondary"
          onClick={() => setShowEditor((prev) => !prev)}
        >
          {showEditor ? "Hide Units" : "Edit Units"}
        </button>
      </div>

      {showEditor && (
        <div className="mt-5 border border-slate-200 p-4 bg-slate-50 rounded-lg">
          <div className="space-y-3">
            {units.map((unit) => {
              const selectedUnit = selectedUnitMap.get(unit.id)
              const isChecked = Boolean(selectedUnit)

              return (
                <div key={unit.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isChecked} onChange={() => toggleUnit(unit.id)} />
                    <span>
                      {unit.name} ({unit.symbol})
                    </span>
                  </label>
                  <div>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      className="pos-input"
                      disabled={!isChecked}
                      value={selectedUnit?.conversion_multiplier ?? ""}
                      onChange={(event) => updateUnitMultiplier(unit.id, event.target.value)}
                      placeholder="Conversion multiplier"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

