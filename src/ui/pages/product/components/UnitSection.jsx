import React, { useEffect, useMemo, useState } from "react"

export default function UnitSection({
  units = [],
  selectedUnits = [],
  excludedUnitIds = [],
  defaultOpen = false,
  onChange,
}) {
  const [showEditor, setShowEditor] = useState(defaultOpen)

  useEffect(() => {
    setShowEditor(defaultOpen)
  }, [defaultOpen])

  const selectedUnitMap = useMemo(() => {
    const map = new Map()
    selectedUnits.forEach((entry) => {
      map.set(entry.unit_id, entry)
    })
    return map
  }, [selectedUnits])

  const normalizedExcludedIds = useMemo(
    () =>
      new Set(
        excludedUnitIds
          .map((unitId) => Number(unitId))
          .filter((unitId) => Number.isFinite(unitId) && unitId > 0),
      ),
    [excludedUnitIds],
  )

  const selectableUnits = useMemo(
    () => units.filter((unit) => !normalizedExcludedIds.has(Number(unit.id))),
    [normalizedExcludedIds, units],
  )

  useEffect(() => {
    const filteredUnits = selectedUnits.filter(
      (entry) => !normalizedExcludedIds.has(Number(entry.unit_id)),
    )

    if (filteredUnits.length !== selectedUnits.length) {
      onChange(filteredUnits)
    }
  }, [normalizedExcludedIds, onChange, selectedUnits])

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
          <p className="text-sm text-slate-500 mb-4">
            Base unit is always available automatically. Select only additional selling units here.
          </p>
          <div className="space-y-3">
            {selectableUnits.map((unit) => {
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
            {selectableUnits.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                No extra units available after excluding the selected base unit.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
