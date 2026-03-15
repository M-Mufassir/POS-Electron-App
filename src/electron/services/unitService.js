import {
  insertUnit,
  selectAllUnits,
  selectUnitById,
  selectUnitsWithProductCounts,
} from "../repositories/unitRepository.js"

export async function getAllUnits() {
  return await selectAllUnits()
}

export async function getUnitById(id) {
  if (!id) {
    throw new Error("Invalid unit ID")
  }
  return await selectUnitById(id)
}

export async function getUnitsWithProductCounts() {
  return await selectUnitsWithProductCounts()
}

export async function addUnit(unitInput) {
  const isStringInput = typeof unitInput === "string"
  const name = (isStringInput ? unitInput : unitInput?.name || "").trim()
  const symbol = (isStringInput ? "" : unitInput?.symbol || "").trim()
  const description = (isStringInput ? "" : unitInput?.description || "").trim()
  const unitType = (isStringInput ? "COUNT" : unitInput?.unit_type || "COUNT").trim()
  const parsedStatus = Number(isStringInput ? 1 : unitInput?.status) === 0 ? 0 : 1
  const parsedBaseMultiplier = Number(isStringInput ? 1 : unitInput?.base_multiplier ?? 1)

  if (!name || !symbol) {
    throw new Error("Name and symbol are required")
  }
  if (!Number.isFinite(parsedBaseMultiplier) || parsedBaseMultiplier <= 0) {
    throw new Error("Base multiplier must be a positive number")
  }

  const result = await insertUnit({
    name,
    symbol,
    description,
    status: parsedStatus,
    unit_type: unitType,
    base_multiplier: parsedBaseMultiplier,
  })

  return {
    id: result.lastID,
    name,
    symbol,
    description,
    status: parsedStatus,
    unit_type: unitType,
    base_multiplier: parsedBaseMultiplier,
  }
}
