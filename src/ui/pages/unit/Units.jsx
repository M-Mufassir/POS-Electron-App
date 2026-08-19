import { useCallback, useEffect, useMemo, useState } from "react"
import Banner from "../../components/Banner"
import AddUnitCard from "./Components/AddUnitCard"
import { useAuth } from "../../context/AuthContext"

function Units() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [savingUnit, setSavingUnit] = useState(false)
  const [banner, setBanner] = useState({ type: "", message: "" })
  const { hasPermission } = useAuth()

  const fetchUnits = useCallback(async (showInitialLoading = false) => {
    if (showInitialLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      const data = await window.api.getUnitsWithProductCounts()
      const normalized = Array.isArray(data)
        ? data.map((unit) => ({
            ...unit,
            product_count: Number(unit.product_count || 0),
            base_multiplier: Number(unit.base_multiplier || 0),
          }))
        : []
      setUnits(normalized)
    } catch (error) {
      console.error("Failed to fetch units:", error)
      setBanner({ type: "error", message: "Failed to load units. Please try again." })
    } finally {
      if (showInitialLoading) {
        setLoading(false)
      } else {
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchUnits(true)
  }, [fetchUnits])

  const summary = useMemo(() => {
    const totalUnits = units.length
    const totalAssignments = units.reduce((sum, unit) => sum + Number(unit.product_count || 0), 0)
    const unitsWithProducts = units.filter((unit) => Number(unit.product_count || 0) > 0).length

    return {
      totalUnits,
      totalAssignments,
      unitsWithProducts,
    }
  }, [units])

  const handleSubmitUnit = async (unitData) => {
    setSavingUnit(true)
    setBanner({ type: "", message: "" })

    try {
      if (editingUnit) {
        await window.api.updateUnit(editingUnit.id, unitData)
        setBanner({ type: "success", message: "Unit updated successfully." })
      } else {
        await window.api.addUnit(unitData)
        setBanner({ type: "success", message: "Unit added successfully." })
      }
      setIsAddModalOpen(false)
      setEditingUnit(null)
      await fetchUnits(false)
    } catch (error) {
      console.error("Failed to save unit:", error)

      let message = error?.message || "Failed to save unit. Please try again."
      if (typeof error?.message === "string" && error.message.toLowerCase().includes("unique")) {
        message = "A unit with this name or symbol already exists."
      }

      throw new Error(message)
    } finally {
      setSavingUnit(false)
    }
  }

  const openEditModal = (unit) => {
    setEditingUnit(unit)
    setIsAddModalOpen(true)
  }

  const handleDeactivate = async (unit) => {
    const confirmed = window.confirm(`Deactivate "${unit.name}"?`)
    if (!confirmed) return

    setBanner({ type: "", message: "" })
    try {
      await window.api.deactivateUnit(unit.id)
      setBanner({ type: "success", message: "Unit deactivated." })
      await fetchUnits(false)
    } catch (error) {
      console.error("Failed to deactivate unit:", error)
      setBanner({ type: "error", message: error?.message || "Failed to deactivate unit." })
    }
  }

  if (loading) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading units...</p>
      </div>
    )
  }

  if (!hasPermission("manage_catalog")) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">You do not have access to manage units.</p>
      </div>
    )
  }

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Units</h1>
          <p className="pos-section-subtitle">
            View all units and how many products use each unit
          </p>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ type: "", message: "" })}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {refreshing ? "Refreshing unit list..." : "Manage measurement units consistently."}
          </p>
          <button
            className="pos-btn-success"
            onClick={() => {
              setEditingUnit(null)
              setIsAddModalOpen(true)
            }}
          >
            Add New Unit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="pos-card">
            <p className="text-sm text-slate-500">Total Units</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{summary.totalUnits}</p>
          </div>
          <div className="pos-card">
            <p className="text-sm text-slate-500">Total Product Assignments</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{summary.totalAssignments}</p>
          </div>
          <div className="pos-card">
            <p className="text-sm text-slate-500">Units With Products</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{summary.unitsWithProducts}</p>
          </div>
        </div>

        <div className="space-y-3">
          {units.length === 0 ? (
            <div className="pos-card">
              <p className="text-slate-600">No units yet. Add your first unit.</p>
            </div>
          ) : (
            units.map((unit) => (
              <div key={unit.id} className="pos-card flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {unit.name} <span className="text-slate-500">({unit.symbol})</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {unit.description || "No description provided."}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Base multiplier: {unit.base_multiplier}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 border border-slate-200 px-4 py-2 min-w-36 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Products</p>
                    <p className="text-2xl font-bold text-slate-800">{unit.product_count}</p>
                  </div>
                  <button type="button" className="pos-btn-secondary" onClick={() => openEditModal(unit)}>
                    Edit
                  </button>
                  <button type="button" className="pos-btn-danger" onClick={() => handleDeactivate(unit)}>
                    Deactivate
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddUnitCard
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingUnit(null)
        }}
        onSubmit={handleSubmitUnit}
        saving={savingUnit}
        editingUnit={editingUnit}
      />
    </div>
  )
}

export default Units
