import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Banner from "../../components/Banner"
import { useAuth } from "../../context/AuthContext"
import { formatAppDateTime } from "../../utils/dateTime"

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return "0.00"
  return amount.toFixed(2)
}

const buildDraftFromBill = (bill) => {
  if (!bill) return null
  const discountType = bill.discount_type || "PERCENTAGE"
  const discountEnabled = Boolean(bill.discount_type)

  return {
    id: bill.id,
    invoice_no: bill.invoice_no,
    customer_name: bill.customer_name || "",
    status: bill.status || "OPEN",
    items: Array.isArray(bill.items) ? bill.items : [],
    discount_type: discountType,
    discount_value: Number(bill.discount_value || 0),
    discount_enabled: discountEnabled,
    paid_amount: Number(bill.paid_amount || 0),
    inventory_applied: Number(bill.inventory_applied || 0),
  }
}

const computeTotals = (draft) => {
  const subtotal = (draft.items || []).reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
  let discountAmount = 0

  if (draft.discount_enabled) {
    const value = Number(draft.discount_value || 0)
    if (draft.discount_type === "PERCENTAGE") {
      const percent = Math.min(100, Math.max(0, value))
      discountAmount = subtotal * (percent / 100)
    } else {
      discountAmount = Math.min(subtotal, Math.max(0, value))
    }
  }

  const total = Math.max(0, subtotal - discountAmount)
  const paid = Math.max(0, Number(draft.paid_amount || 0))
  const balance = Math.max(0, total - paid)
  const change = Math.max(0, paid - total)

  return { subtotal, discountAmount, total, paid, balance, change }
}

const buildUnitOptions = (details) => {
  const units = []
  const seen = new Set()

  const addUnit = (unit) => {
    const parsedId = Number(unit?.id)
    if (!Number.isFinite(parsedId) || parsedId <= 0 || seen.has(parsedId)) {
      return
    }

    seen.add(parsedId)
    units.push({
      id: parsedId,
      name: unit?.name || "",
      symbol: unit?.symbol || "",
      multiplier: Number(unit?.multiplier || unit?.conversion_multiplier || 1) || 1,
    })
  }

  addUnit({
    id: details?.base_unit_id,
    name: details?.base_unit_name,
    symbol: details?.base_unit_symbol,
    multiplier: 1,
  })

  ;(details?.units || []).forEach((unit) => {
    addUnit(unit)
  })

  return units
}

const STOCK_EPSILON = 0.000001

const formatQuantity = (value) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return "0"
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, "")
}

const getItemUnitMultiplier = (item) => {
  const parsedMultiplier = Number(item?.unit_multiplier || item?.multiplier || 1)
  if (!Number.isFinite(parsedMultiplier) || parsedMultiplier <= 0) {
    return 1
  }

  return parsedMultiplier
}

const getItemBaseQuantity = (item) => {
  const parsedBaseQuantity = Number(item?.base_quantity)
  if (Number.isFinite(parsedBaseQuantity) && parsedBaseQuantity >= 0) {
    return parsedBaseQuantity
  }

  return Math.max(0, Number(item?.quantity || 0)) * getItemUnitMultiplier(item)
}

const getDraftProductUsage = (items, productId, excludeIndex = null) => {
  return (items || []).reduce((sum, item, itemIndex) => {
    if (Number(item?.product_id) !== Number(productId)) {
      return sum
    }
    if (excludeIndex !== null && itemIndex === excludeIndex) {
      return sum
    }

    return sum + getItemBaseQuantity(item)
  }, 0)
}

const getRemainingBaseStock = ({ items, productId, stockBaseQty, excludeIndex = null }) => {
  const availableStock = Math.max(0, Number(stockBaseQty || 0))
  const usedStock = getDraftProductUsage(items, productId, excludeIndex)
  return Math.max(0, availableStock - usedStock)
}

const ReceiptModal = ({ stage, data }) => {
  const stageText =
    stage === "done"
      ? "Print completed"
      : stage === "printing"
        ? "Printing receipt..."
        : "Preparing receipt..."

  return (
    <div className="receipt-overlay">
      <div className="receipt-card receipt-slk">
        <div className={`receipt-status ${stage}`}>{stageText}</div>
        <div className="receipt-body">
          <div className="receipt-header">
            <h3>Anver Stores</h3>
            <p>ZILLIT | POS</p>
            <p>No. 21, Main Street, Colombo</p>
            <p>Tel: 011-2345678</p>
          </div>
          <div className="receipt-meta-block">
            <span>Invoice: {data.invoice_no}</span>
            <span>Date: {data.printed_at ? formatAppDateTime(data.printed_at) : ""}</span>
            <span>Customer: {data.customer_name || "Walk-in"}</span>
          </div>

          <div className="receipt-items">
            <div className="receipt-row receipt-head">
              <span>Item</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Total</span>
            </div>
            {(data.items || []).map((item, index) => (
              <div key={`${item.product_id}-${index}`} className="receipt-row">
                <span>{item.product_name}</span>
                <span>{item.quantity}</span>
                <span>Rs. {formatCurrency(item.unit_price)}</span>
                <span>Rs. {formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="receipt-total">
            <div className="receipt-row">
              <span>Subtotal</span>
              <strong>Rs. {formatCurrency(data?.totals?.subtotal || 0)}</strong>
            </div>
            <div className="receipt-row">
              <span>Discount</span>
              <strong>Rs. {formatCurrency(data?.totals?.discountAmount || 0)}</strong>
            </div>
            <div className="receipt-row">
              <span>Total</span>
              <strong>Rs. {formatCurrency(data?.totals?.total || 0)}</strong>
            </div>
            <div className="receipt-row">
              <span>Paid</span>
              <strong>Rs. {formatCurrency(data?.paid_amount || data?.totals?.total || 0)}</strong>
            </div>
            <div className="receipt-row">
              <span>Balance</span>
              <strong>Rs. {formatCurrency(data?.balance_amount || data?.totals?.balance || 0)}</strong>
            </div>
            <div className="receipt-row">
              <span>Change</span>
              <strong>Rs. {formatCurrency(data?.totals?.change || 0)}</strong>
            </div>
          </div>
          <div className="receipt-footer">
            <p>Thank you for shopping with us.</p>
            <p>Goods once sold are not returnable.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const BillEditor = ({
  draft,
  onDraftChange,
  onSave,
  onComplete,
  onCancel,
  onDelete,
  onAfterComplete,
  products,
  canDeleteBill,
}) => {
  const [barcodeInput, setBarcodeInput] = useState("")
  const [productQuery, setProductQuery] = useState("")
  const [productMatches, setProductMatches] = useState([])
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [availableUnits, setAvailableUnits] = useState([])
  const [selectedUnitId, setSelectedUnitId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [banner, setBanner] = useState({ type: "", message: "" })
  const [printReceipt, setPrintReceipt] = useState(true)
  const [receiptState, setReceiptState] = useState({
    open: false,
    stage: "idle",
    data: null,
  })
  const barcodeInputRef = useRef(null)
  const productSearchRef = useRef(null)
  const unitSelectRef = useRef(null)
  const quantityInputRef = useRef(null)
  const completeButtonRef = useRef(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      barcodeInputRef.current?.focus()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [draft.id])

  useEffect(() => {
    const term = productQuery.trim().toLowerCase()
    if (!term) {
      setProductMatches([])
      setHighlightedProductIndex(-1)
      return
    }

    const matches = products
      .filter((product) => {
        const name = String(product.name || "").toLowerCase()
        const code = String(product.code || "").toLowerCase()
        return name.includes(term) || code.includes(term)
      })
      .slice(0, 8)
    setProductMatches(matches)
    setHighlightedProductIndex(matches.length > 0 ? 0 : -1)
  }, [productQuery, products])

  const totals = useMemo(() => computeTotals(draft), [draft])
  const selectedUnit = useMemo(
    () => availableUnits.find((unit) => Number(unit.id) === Number(selectedUnitId)),
    [availableUnits, selectedUnitId],
  )
  const selectedUnitPrice = useMemo(() => {
    if (!selectedProduct || !selectedUnit) return 0
    const basePrice = Number(selectedProduct.base_price || 0)
    const multiplier = Number(selectedUnit.multiplier || 1)
    return basePrice * multiplier
  }, [selectedProduct, selectedUnit])
  const selectedQty = Math.max(0, Number(quantity || 0))
  const selectedRemainingBaseQty = useMemo(() => {
    if (!selectedProduct) return 0

    return getRemainingBaseStock({
      items: draft.items,
      productId: selectedProduct.id,
      stockBaseQty: selectedProduct.stock_base_qty,
    })
  }, [draft.items, selectedProduct])
  const selectedMaxQty = useMemo(() => {
    if (!selectedUnit) return 0

    const multiplier = Number(selectedUnit.multiplier || 1)
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      return 0
    }

    return selectedRemainingBaseQty / multiplier
  }, [selectedRemainingBaseQty, selectedUnit])
  const selectedLineTotal = selectedUnitPrice * selectedQty
  const editorSummary = useMemo(
    () => ({
      items: draft.items.length,
      subtotal: totals.subtotal,
      total: totals.total,
      balance: totals.balance,
    }),
    [draft.items.length, totals],
  )
  const isInventoryLocked = Number(draft.inventory_applied || 0) === 1
  const canCancelBill = !isInventoryLocked && String(draft.status || "OPEN").toUpperCase() !== "PAID"
  const canDeleteCurrentBill = canDeleteBill && !isInventoryLocked

  const getProductStockBaseQty = (productId, fallbackStock = 0) => {
    const matchedProduct = products.find((product) => Number(product.id) === Number(productId))
    if (matchedProduct) {
      return Math.max(0, Number(matchedProduct.stock_base_qty || 0))
    }

    return Math.max(0, Number(fallbackStock || 0))
  }

  const showExceededStockWarning = (productName, maxQty, unitLabel) => {
    const normalizedUnitLabel = unitLabel || "units"

    if (maxQty > STOCK_EPSILON) {
      setBanner({
        type: "warning",
        message: `${productName} only has ${formatQuantity(maxQty)} ${normalizedUnitLabel} remaining. Quantity was adjusted.`,
      })
      return
    }

    setBanner({
      type: "warning",
      message: `${productName} is out of stock.`,
    })
  }

  const clampQuantityToAvailableStock = ({
    requestedQty,
    productId,
    productName,
    stockBaseQty,
    multiplier,
    unitLabel,
    excludeIndex = null,
  }) => {
    const safeRequestedQty = Math.max(0, Number(requestedQty || 0))
    const safeMultiplier = Number(multiplier || 1)

    if (!Number.isFinite(safeRequestedQty) || !Number.isFinite(safeMultiplier) || safeMultiplier <= 0) {
      return { quantity: 0, adjusted: false }
    }

    const remainingBaseQty = getRemainingBaseStock({
      items: draft.items,
      productId,
      stockBaseQty: getProductStockBaseQty(productId, stockBaseQty),
      excludeIndex,
    })
    const maxQty = remainingBaseQty / safeMultiplier

    if (safeRequestedQty <= maxQty + STOCK_EPSILON) {
      return {
        quantity: safeRequestedQty,
        adjusted: false,
        remainingBaseQty,
        maxQty,
      }
    }

    const clampedQty = Math.max(0, maxQty)
    showExceededStockWarning(productName, clampedQty, unitLabel)

    return {
      quantity: clampedQty,
      adjusted: true,
      remainingBaseQty,
      maxQty,
    }
  }

  const focusBarcodeInput = () => {
    window.setTimeout(() => {
      barcodeInputRef.current?.focus()
      barcodeInputRef.current?.select?.()
    }, 0)
  }

  const focusProductSearch = () => {
    window.setTimeout(() => {
      productSearchRef.current?.focus()
      productSearchRef.current?.select?.()
    }, 0)
  }

  const resetItemSelection = (focusTarget = "product") => {
    setProductQuery("")
    setProductMatches([])
    setSelectedProduct(null)
    setAvailableUnits([])
    setSelectedUnitId("")
    setQuantity(1)

    if (focusTarget === "barcode") {
      focusBarcodeInput()
      return
    }

    focusProductSearch()
  }

  const focusUnitSelect = () => {
    window.setTimeout(() => {
      unitSelectRef.current?.focus()
    }, 0)
  }

  const focusQuantityInput = () => {
    window.setTimeout(() => {
      quantityInputRef.current?.focus()
      quantityInputRef.current?.select?.()
    }, 0)
  }

  const handleSelectedQuantityInputChange = (nextValue) => {
    if (nextValue === "") {
      setQuantity("")
      return
    }

    if (!selectedProduct || !selectedUnit) {
      setQuantity(nextValue)
      return
    }

    const requestedQty = Number(nextValue)
    if (!Number.isFinite(requestedQty) || requestedQty < 0) {
      setQuantity(nextValue)
      return
    }

    const { quantity: clampedQty } = clampQuantityToAvailableStock({
      requestedQty,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      stockBaseQty: selectedProduct.stock_base_qty,
      multiplier: selectedUnit.multiplier,
      unitLabel: selectedUnit.symbol || selectedUnit.name || "units",
    })

    setQuantity(clampedQty)
  }

  const handleSelectProduct = async (product) => {
    setProductQuery(`${product.name}`)
    setProductMatches([])
    setHighlightedProductIndex(-1)

    try {
      const details = await window.api.getProductById(Number(product.id))
      const normalizedProduct = { ...product, ...details }
      const unitOptions = buildUnitOptions(normalizedProduct)
      setSelectedProduct(normalizedProduct)
      setAvailableUnits(unitOptions)
      setSelectedUnitId(String(unitOptions[0]?.id || ""))
      focusUnitSelect()
    } catch (error) {
      console.error("Failed to load product units:", error)
      setBanner({ type: "error", message: "Failed to load units for the selected product." })
    }
  }

  const handleFindProduct = async () => {
    const selectedMatch =
      productMatches[0] ||
      products.find((product) => {
        const term = productQuery.trim().toLowerCase()
        if (!term) return false
        return (
          String(product.name || "").toLowerCase() === term ||
          String(product.code || "").toLowerCase() === term
        )
      })

    if (!selectedMatch) {
      setBanner({ type: "warning", message: "No matching product found." })
      return
    }

    await handleSelectProduct(selectedMatch)
  }

  const handleClearProductSelection = () => {
    resetItemSelection("product")
  }

  const appendItem = (item) => {
    const existingIndex = draft.items.findIndex(
      (entry) =>
        entry.product_id === item.product_id &&
        entry.unit_id === item.unit_id &&
        Number(entry.unit_price) === Number(item.unit_price) &&
        Number(entry.barcode_id || 0) === Number(item.barcode_id || 0),
    )

    const itemMultiplier = getItemUnitMultiplier(item)
    let updatedItems = [...draft.items]
    if (existingIndex >= 0) {
      const existing = updatedItems[existingIndex]
      const lineMultiplier = Number(existing.unit_multiplier || item.unit_multiplier || itemMultiplier || 1) || 1
      const newQty = Number(existing.quantity || 0) + Number(item.quantity || 0)
      const newSubtotal = Number(existing.unit_price || 0) * newQty
      updatedItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        subtotal: newSubtotal,
        unit_multiplier: lineMultiplier,
        base_quantity: newQty * lineMultiplier,
      }
    } else {
      updatedItems = [
        ...updatedItems,
        {
          ...item,
          unit_multiplier: itemMultiplier,
          base_quantity: Number(item.base_quantity || 0) || Number(item.quantity || 0) * itemMultiplier,
        },
      ]
    }

    onDraftChange({ ...draft, items: updatedItems })
  }

  const handleAddSelected = () => {
    if (isInventoryLocked) {
      setBanner({ type: "warning", message: "Inventory is already applied. Items cannot be changed on this bill." })
      return
    }
    if (!selectedProduct || !selectedUnitId) return
    const unit = availableUnits.find((entry) => Number(entry.id) === Number(selectedUnitId))
    const multiplier = Number(unit?.multiplier || 1)
    const basePrice = Number(selectedProduct.base_price || 0)
    const qty = Number(quantity || 0)

    if (!Number.isFinite(qty) || qty <= 0) {
      setBanner({ type: "warning", message: "Enter a quantity greater than 0." })
      return
    }

    const { quantity: nextQty } = clampQuantityToAvailableStock({
      requestedQty: qty,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      stockBaseQty: selectedProduct.stock_base_qty,
      multiplier,
      unitLabel: unit?.symbol || unit?.name || "units",
    })

    if (nextQty <= STOCK_EPSILON) {
      return
    }

    const unitPrice = basePrice * multiplier
    appendItem({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      unit_id: Number(selectedUnitId),
      unit_name: unit?.name,
      unit_symbol: unit?.symbol,
      quantity: nextQty,
      unit_price: unitPrice,
      subtotal: unitPrice * nextQty,
      barcode_id: null,
      stock_base_qty: selectedProduct.stock_base_qty,
      unit_multiplier: multiplier,
      base_quantity: nextQty * multiplier,
    })

    resetItemSelection("product")
  }

  const handleBarcodeSubmit = async (event) => {
    event.preventDefault()
    setBanner({ type: "", message: "" })

    if (isInventoryLocked) {
      setBanner({ type: "warning", message: "Inventory is already applied. Items cannot be changed on this bill." })
      return
    }

    const code = barcodeInput.trim()
    if (!code) return

    try {
      const resolved = await window.api.resolveBarcode(code)
      if (!resolved) {
        setBanner({ type: "warning", message: "Barcode not found." })
        focusBarcodeInput()
        return
      }

      const qty = Number(quantity || 0)
      if (!Number.isFinite(qty) || qty <= 0) {
        setBanner({ type: "warning", message: "Enter a quantity greater than 0." })
        focusBarcodeInput()
        return
      }

      const { quantity: nextQty } = clampQuantityToAvailableStock({
        requestedQty: qty,
        productId: resolved.product_id,
        productName: resolved.product_name,
        stockBaseQty: resolved.stock_base_qty,
        multiplier: resolved.multiplier,
        unitLabel: resolved.unit_symbol || resolved.unit_name || "units",
      })

      if (nextQty <= STOCK_EPSILON) {
        focusBarcodeInput()
        return
      }

      appendItem({
        product_id: resolved.product_id,
        product_name: resolved.product_name,
        unit_id: resolved.unit_id,
        unit_name: resolved.unit_name,
        unit_symbol: resolved.unit_symbol,
        quantity: nextQty,
        unit_price: resolved.unit_price,
        subtotal: resolved.unit_price * nextQty,
        barcode_id: resolved.barcode_id,
        stock_base_qty: resolved.stock_base_qty,
        unit_multiplier: resolved.multiplier,
        base_quantity: nextQty * Number(resolved.multiplier || 1),
      })

      setBarcodeInput("")
      setQuantity(1)
      focusBarcodeInput()
    } catch (error) {
      console.error("Failed to resolve barcode:", error)
      setBanner({ type: "error", message: "Barcode lookup failed." })
      focusBarcodeInput()
    }
  }

  const handleQuantityChange = (index, nextValue) => {
    if (isInventoryLocked) {
      setBanner({ type: "warning", message: "Inventory is already applied. Items cannot be changed on this bill." })
      return
    }

    const itemToUpdate = draft.items[index]
    if (!itemToUpdate) return

    const nextQty = Math.max(0, Number(nextValue || 0))
    const multiplier = getItemUnitMultiplier(itemToUpdate)
    const { quantity: clampedQty } = clampQuantityToAvailableStock({
      requestedQty: nextQty,
      productId: itemToUpdate.product_id,
      productName: itemToUpdate.product_name,
      stockBaseQty: itemToUpdate.stock_base_qty,
      multiplier,
      unitLabel: itemToUpdate.unit_symbol || itemToUpdate.unit_name || "units",
      excludeIndex: index,
    })

    const updatedItems = draft.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      const unitPrice = Number(item.unit_price || 0)
      return {
        ...item,
        quantity: clampedQty,
        subtotal: unitPrice * clampedQty,
        unit_multiplier: multiplier,
        base_quantity: clampedQty * multiplier,
      }
    })
    onDraftChange({ ...draft, items: updatedItems })
  }

  const handleRemoveItem = (index) => {
    if (isInventoryLocked) {
      setBanner({ type: "warning", message: "Inventory is already applied. Items cannot be changed on this bill." })
      return
    }
    const updatedItems = draft.items.filter((_, itemIndex) => itemIndex !== index)
    onDraftChange({ ...draft, items: updatedItems })
  }

  const handleSave = async () => {
    try {
      const savedBill = await onSave()
      if (savedBill) {
        setBanner({ type: "success", message: "Bill saved successfully." })
      }
    } catch (error) {
      console.error("Failed to save bill:", error)
      setBanner({ type: "error", message: error?.message || "Failed to save bill." })
    }
  }

  const handleComplete = async () => {
    const completedBill = await onComplete()
    const shouldCloseAfterComplete = completedBill?.status === "PAID"
    const receiptTotals = computeTotals({
      ...draft,
      ...buildDraftFromBill({
        ...draft,
        ...completedBill,
        items: draft.items,
      }),
    })

    if (!printReceipt) {
      if (shouldCloseAfterComplete) {
        onAfterComplete?.()
      } else {
        setBanner({
          type: "success",
          message: "Bill saved with an outstanding balance. It will stay in the open bills list.",
        })
        focusBarcodeInput()
      }
      return
    }

    const receiptData = {
      ...draft,
      ...completedBill,
      totals: receiptTotals,
      printed_at: new Date().toISOString(),
    }

    setReceiptState({ open: true, stage: "loading", data: receiptData })

    setTimeout(() => {
      setReceiptState((prev) => ({ ...prev, stage: "printing" }))
      try {
        window.print()
      } catch (error) {
        console.error("Print failed:", error)
      }
    }, 300)

    setTimeout(() => {
      setReceiptState((prev) => ({ ...prev, stage: "done" }))
    }, 1400)

    setTimeout(() => {
      setReceiptState({ open: false, stage: "idle", data: null })
      if (shouldCloseAfterComplete) {
        onAfterComplete?.()
      } else {
        setBanner({
          type: "success",
          message: "Bill saved with an outstanding balance. It will stay in the open bills list.",
        })
        focusBarcodeInput()
      }
    }, 2200)
  }

  const handleCancel = async () => {
    const confirmCancel = window.confirm("Cancel this bill? It will be marked as cancelled.")
    if (!confirmCancel) return
    try {
      await onCancel()
    } catch (error) {
      console.error("Failed to cancel bill:", error)
      setBanner({ type: "error", message: error?.message || "Failed to cancel bill." })
    }
  }

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Delete this bill? This cannot be undone.")
    if (!confirmDelete) return
    try {
      await onDelete()
    } catch (error) {
      console.error("Failed to delete bill:", error)
      setBanner({ type: "error", message: error?.message || "Failed to delete bill." })
    }
  }

  const handlePaidAmountKeyDown = (event) => {
    if (event.key !== "Enter") return
    event.preventDefault()
    completeButtonRef.current?.focus()
  }

  const handleProductSearchKeyDown = async (event) => {
    if (event.key === "ArrowDown") {
      if (productMatches.length === 0) return
      event.preventDefault()
      setHighlightedProductIndex((prev) =>
        prev < 0 ? 0 : Math.min(prev + 1, productMatches.length - 1),
      )
      return
    }

    if (event.key === "ArrowUp") {
      if (productMatches.length === 0) return
      event.preventDefault()
      setHighlightedProductIndex((prev) =>
        prev <= 0 ? 0 : prev - 1,
      )
      return
    }

    if (event.key === "Escape") {
      if (productMatches.length === 0) return
      event.preventDefault()
      setProductMatches([])
      setHighlightedProductIndex(-1)
      return
    }

    if (event.key !== "Enter") return
    event.preventDefault()

    if (productMatches.length > 0) {
      const matchedProduct =
        productMatches[highlightedProductIndex >= 0 ? highlightedProductIndex : 0]
      if (matchedProduct) {
        await handleSelectProduct(matchedProduct)
        focusQuantityInput()
        return
      }
    }

    if (selectedProduct && selectedUnitId) {
      handleAddSelected()
      return
    }

    await handleFindProduct()
    focusQuantityInput()
  }

  const handleUnitSelectKeyDown = (event) => {
    if (event.key !== "Enter") return
    event.preventDefault()
    focusQuantityInput()
  }

  const handleQuantityKeyDown = (event) => {
    if (event.key !== "Enter") return
    event.preventDefault()
    handleAddSelected()
  }

  return (
    <div className="billing-editor">
      <div className="billing-editor-header billing-workbench-header">
        <div>
          <h2 className="pos-section-title text-base">{draft.invoice_no}</h2>
          <p className="pos-section-subtitle">Status: {draft.status}</p>
        </div>
        <div className="billing-workbench-meta">
          <span className={`billing-pill ${String(draft.status || "OPEN").toLowerCase()}`}>
            {draft.status}
          </span>
          <span className="billing-shortcut-note">Enter adds products and moves payment flow forward</span>
        </div>
      </div>

      <div className="billing-ops-summary">
        <div className="page-summary-card">
          <span className="page-summary-label">Line Items</span>
          <strong>{editorSummary.items}</strong>
        </div>
        <div className="page-summary-card info">
          <span className="page-summary-label">Subtotal</span>
          <strong>Rs. {formatCurrency(editorSummary.subtotal)}</strong>
        </div>
        <div className="page-summary-card accent">
          <span className="page-summary-label">Bill Total</span>
          <strong>Rs. {formatCurrency(editorSummary.total)}</strong>
        </div>
        <div className="page-summary-card danger">
          <span className="page-summary-label">Outstanding</span>
          <strong>Rs. {formatCurrency(editorSummary.balance)}</strong>
        </div>
      </div>

      <Banner
        type={banner.type}
        message={banner.message}
        onClose={() => setBanner({ type: "", message: "" })}
      />

      <div className="pos-card compact billing-entry-section">
        <div className="billing-card-topline billing-card-topline-compact">
          <div>
            <h3 className="pos-section-title text-sm">Items</h3>
          </div>
          <button
            type="button"
            className="pos-btn-secondary"
            onClick={handleClearProductSelection}
            disabled={isInventoryLocked}
          >
            Clear
          </button>
        </div>
        <div className="billing-entry-table-wrap">
          <table className="pos-table billing-items-table billing-entry-items-table">
            <thead>
              <tr>
                <th>Scan Barcode</th>
                <th>Product</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="billing-entry-row">
                <td>
                  <form className="billing-inline-form" onSubmit={handleBarcodeSubmit}>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      className="pos-input"
                      placeholder="Scan or enter barcode"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      disabled={isInventoryLocked}
                    />
                  </form>
                </td>
                <td>
                  <div className="billing-product-search">
                    <input
                      ref={productSearchRef}
                      type="text"
                      className="pos-input"
                      placeholder="Type product name or code"
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      onKeyDown={handleProductSearchKeyDown}
                      disabled={isInventoryLocked}
                    />
                      {productMatches.length > 0 && !isInventoryLocked && (
                        <div className="billing-suggestions">
                          {productMatches.map((product, index) => (
                            <button
                              key={product.id}
                              type="button"
                              className={`billing-suggestion ${
                                index === highlightedProductIndex ? "active" : ""
                              }`}
                              onClick={() => handleSelectProduct(product)}
                              onMouseEnter={() => setHighlightedProductIndex(index)}
                            >
                              <span>{product.name}</span>
                              <span className="billing-suggestion-code">{product.code || ""}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <select
                    ref={unitSelectRef}
                    className="pos-input"
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    onKeyDown={handleUnitSelectKeyDown}
                    disabled={isInventoryLocked}
                  >
                    <option value="">Select Unit</option>
                    {availableUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    ref={quantityInputRef}
                    type="number"
                    min="0"
                    step="any"
                    className="pos-input"
                    value={quantity}
                    onChange={(e) => handleSelectedQuantityInputChange(e.target.value)}
                    onKeyDown={handleQuantityKeyDown}
                    disabled={isInventoryLocked}
                  />
                  {selectedProduct && selectedUnit ? (
                    <div className="mt-1 text-xs text-gray-500">
                      Remaining: {formatQuantity(selectedRemainingBaseQty)} {selectedProduct.base_unit_symbol || selectedProduct.base_unit_name || "base units"} | Max: {formatQuantity(selectedMaxQty)} {selectedUnit.symbol || selectedUnit.name || "units"}
                    </div>
                  ) : null}
                </td>
                <td className="billing-entry-cell-strong">
                  {selectedProduct && selectedUnit
                    ? `Rs. ${formatCurrency(selectedUnitPrice)}`
                    : "Select product"}
                </td>
                <td className="billing-entry-cell-strong">
                  {selectedProduct && selectedUnit
                    ? `Rs. ${formatCurrency(selectedLineTotal)}`
                    : "Rs. 0.00"}
                </td>
                <td>
                  <button
                    type="button"
                    className="pos-btn-primary w-full"
                    onClick={handleAddSelected}
                    disabled={isInventoryLocked || !selectedProduct || !selectedUnitId}
                  >
                    Add
                  </button>
                </td>
              </tr>
              {draft.items.map((item, index) => (
                <tr key={`${item.product_id}-${index}`}>
                  <td className="billing-entry-muted">{item.barcode_id ? "Scanned" : "-"}</td>
                  <td>{item.product_name}</td>
                  <td>{item.unit_name || ""}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="pos-input billing-qty"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      disabled={isInventoryLocked}
                    />
                  </td>
                  <td>Rs. {formatCurrency(item.unit_price)}</td>
                  <td>Rs. {formatCurrency(item.subtotal)}</td>
                  <td>
                    <button
                      type="button"
                      className="pos-btn-danger"
                      onClick={() => handleRemoveItem(index)}
                      disabled={isInventoryLocked}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {draft.items.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-gray-500 py-6">
                    Add a product above to start the bill.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pos-card compact billing-settlement-card billing-settlement-card-full">
        <div className="billing-card-topline billing-card-topline-compact">
          <div>
            <h3 className="pos-section-title text-sm">Settlement</h3>
          </div>
        </div>

        <div className="billing-settlement-grid">
          <div className="pos-form-group">
            <label className="pos-label">Customer Name</label>
            <input
              type="text"
              className="pos-input"
              value={draft.customer_name}
              onChange={(e) => onDraftChange({ ...draft, customer_name: e.target.value })}
              placeholder="Walk-in customer"
            />
          </div>

          <div className="pos-form-group">
            <label className="pos-label">Discount Mode</label>
            <select
              className="pos-input"
              value={draft.discount_enabled ? draft.discount_type : "NONE"}
              onChange={(e) => {
                if (e.target.value === "NONE") {
                  onDraftChange({ ...draft, discount_enabled: false, discount_value: 0 })
                  return
                }
                onDraftChange({
                  ...draft,
                  discount_enabled: true,
                  discount_type: e.target.value,
                })
              }}
            >
              <option value="NONE">No Discount</option>
              <option value="PERCENTAGE">Percentage</option>
              <option value="AMOUNT">Amount</option>
            </select>
          </div>

          <div className="pos-form-group">
            <label className="pos-label">Discount Value</label>
            <input
              type="number"
              min="0"
              className="pos-input"
              value={draft.discount_enabled ? draft.discount_value : 0}
              onChange={(e) =>
                onDraftChange({
                  ...draft,
                  discount_enabled: true,
                  discount_value: e.target.value,
                })
              }
            />
          </div>

          <div className="pos-form-group">
            <label className="pos-label">Paid Amount</label>
            <input
              type="number"
              min="0"
              step="any"
              className="pos-input"
              value={draft.paid_amount}
              onChange={(e) => onDraftChange({ ...draft, paid_amount: e.target.value })}
              onKeyDown={handlePaidAmountKeyDown}
            />
          </div>
        </div>

        <div className="billing-totals-table-wrap">
          <table className="pos-table billing-totals-table">
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td>Rs. {formatCurrency(totals.subtotal)}</td>
              </tr>
              <tr>
                <td>Discount</td>
                <td>Rs. {formatCurrency(totals.discountAmount)}</td>
              </tr>
              <tr>
                <td>Total</td>
                <td>Rs. {formatCurrency(totals.total)}</td>
              </tr>
              <tr>
                <td>Paid</td>
                <td>Rs. {formatCurrency(totals.paid)}</td>
              </tr>
              <tr className="billing-total-emphasis">
                <td>Balance</td>
                <td>Rs. {formatCurrency(totals.balance)}</td>
              </tr>
              <tr className="billing-total-positive">
                <td>Change To Give</td>
                <td>Rs. {formatCurrency(totals.change)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="billing-actions">
          <label className="billing-radio">
            <input
              type="checkbox"
              checked={printReceipt}
              onChange={(e) => setPrintReceipt(e.target.checked)}
            />
            Print receipt after completion
          </label>
          <div className="billing-action-buttons">
            <button className="pos-btn-secondary" onClick={handleCancel} disabled={!canCancelBill}>
              Cancel Bill
            </button>
            {canDeleteCurrentBill ? (
              <button className="pos-btn-danger" onClick={handleDelete}>
                Delete Bill
              </button>
            ) : null}
            <button className="pos-btn-secondary" onClick={handleSave}>
              Save Bill
            </button>
            <button ref={completeButtonRef} className="pos-btn-success" onClick={handleComplete}>
              Complete Bill
            </button>
          </div>
        </div>
      </div>

      {receiptState.open && receiptState.data ? (
        <ReceiptModal stage={receiptState.stage} data={receiptState.data} />
      ) : null}
    </div>
  )
}

export default function BillingWorkspace() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [openBills, setOpenBills] = useState([])
  const [products, setProducts] = useState([])
  const [billTabs, setBillTabs] = useState([])
  const [activeBillId, setActiveBillId] = useState(null)
  const [billDrafts, setBillDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [openBillSearch, setOpenBillSearch] = useState("")

  const refreshOpenBills = async () => {
    const data = await window.api.getOpenBills()
    setOpenBills(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true)
      try {
        const [openBillData, productData] = await Promise.all([
          window.api.getOpenBills(),
          window.api.getAllProducts(),
        ])
        setOpenBills(Array.isArray(openBillData) ? openBillData : [])
        setProducts((Array.isArray(productData) ? productData : []).filter((product) => Number(product.status) === 1))
      } catch (error) {
        console.error("Failed to load billing workspace:", error)
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [])

  const filteredOpenBills = useMemo(() => {
    const term = openBillSearch.trim().toLowerCase()
    if (!term) return openBills

    return openBills.filter((bill) => {
      return (
        String(bill.invoice_no || "").toLowerCase().includes(term) ||
        String(bill.customer_name || "").toLowerCase().includes(term) ||
        String(bill.product_names || "").toLowerCase().includes(term) ||
        String(bill.status || "").toLowerCase().includes(term)
      )
    })
  }, [openBills, openBillSearch])

  const openBillSummary = useMemo(() => {
    const partialBills = openBills.filter((bill) => bill.status === "PARTIAL").length
    const openOnlyBills = openBills.filter((bill) => bill.status === "OPEN").length
    const outstandingAmount = openBills.reduce(
      (sum, bill) => sum + Number(bill.balance_amount || 0),
      0,
    )

    return {
      totalOpen: openBills.length,
      openOnlyBills,
      partialBills,
      outstandingAmount,
    }
  }, [openBills])

  const openBillTab = async (billId) => {
    const id = Number(billId)
    if (!Number.isFinite(id)) return

    if (!billTabs.includes(id)) {
      setBillTabs((prev) => [...prev, id])
    }

    setActiveBillId(id)

    if (!billDrafts[id]) {
      const bill = await window.api.getBillById(id)
      if (bill) {
        setBillDrafts((prev) => ({
          ...prev,
          [id]: buildDraftFromBill(bill),
        }))
      }
    }
  }

  const handleCreateBill = async () => {
    const newBill = await window.api.createBill({})
    await refreshOpenBills()
    await openBillTab(newBill.id)
  }

  const handleCloseTab = (billId) => {
    setBillTabs((prev) => {
      const next = prev.filter((id) => id !== billId)
      if (activeBillId === billId) {
        setActiveBillId(next[0] || null)
      }
      return next
    })
    setBillDrafts((prev) => {
      const next = { ...prev }
      delete next[billId]
      return next
    })
  }

  const handleDraftChange = (draft) => {
    setBillDrafts((prev) => ({
      ...prev,
      [draft.id]: draft,
    }))
  }

  const handleSaveBill = async (draft) => {
    const validItems = draft.items.filter((item) => Number(item.quantity || 0) > 0)
    const payload = {
      id: draft.id,
      customer_name: draft.customer_name,
      discount_type: draft.discount_enabled ? draft.discount_type : null,
      discount_value: draft.discount_enabled ? draft.discount_value : 0,
      paid_amount: draft.paid_amount,
      items: validItems.map((item) => ({
        product_id: item.product_id,
        unit_id: item.unit_id,
        barcode_id: item.barcode_id,
        quantity: item.quantity,
      })),
    }

    await window.api.saveBill(payload)
    const refreshed = await window.api.getBillById(draft.id)
    if (refreshed) {
      setBillDrafts((prev) => ({
        ...prev,
        [draft.id]: buildDraftFromBill(refreshed),
      }))
    }
    await refreshOpenBills()
    return refreshed
  }

  const handleCompleteBill = async (draft) => {
    return await handleSaveBill(draft)
  }

  const handleCancelBill = async (draft) => {
    await window.api.cancelBill(draft.id)
    await refreshOpenBills()
    handleCloseTab(draft.id)
  }

  const handleDeleteBill = async (draft) => {
    await window.api.deleteBill(draft.id)
    await refreshOpenBills()
    handleCloseTab(draft.id)
  }

  if (loading) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading billing workspace...</div>
        </div>
      </div>
    )
  }

  const activeDraft = activeBillId ? billDrafts[activeBillId] : null

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Billing Workspace</h1>
          <p className="pos-section-subtitle">Open bills and new billing in one place</p>
        </div>
        <div className="billing-header-actions">
          <button className="pos-btn-secondary" onClick={() => navigate("/billing/all")}>
            Bills List
          </button>
        </div>
      </div>

      <div className="billing-layout">
        <aside className="billing-sidebar">
          <div className="billing-sidebar-header">
            <div>
              <h2 className="pos-section-title text-base">Open Bills</h2>
              <p className="pos-section-subtitle">Unpaid and partially paid</p>
            </div>
            <button className="pos-btn-success" onClick={handleCreateBill}>
              New Bill
            </button>
          </div>

          <div className="billing-sidebar-summary">
            <div className="page-summary-card">
              <span className="page-summary-label">Open Queue</span>
              <strong>{openBillSummary.totalOpen}</strong>
            </div>
            <div className="page-summary-card warning">
              <span className="page-summary-label">Open</span>
              <strong>{openBillSummary.openOnlyBills}</strong>
            </div>
            <div className="page-summary-card info">
              <span className="page-summary-label">Partial</span>
              <strong>{openBillSummary.partialBills}</strong>
            </div>
            <div className="page-summary-card danger">
              <span className="page-summary-label">Outstanding</span>
              <strong>Rs. {formatCurrency(openBillSummary.outstandingAmount)}</strong>
            </div>
          </div>

          <form className="billing-sidebar-search" onSubmit={(event) => event.preventDefault()}>
            <input
              type="text"
              className="pos-input"
              placeholder="Search invoice, customer, or item"
              value={openBillSearch}
              onChange={(event) => setOpenBillSearch(event.target.value)}
            />
            <div className="page-search-actions billing-search-actions">
              <button type="submit" className="pos-btn-primary">
                Search
              </button>
              <button
                type="button"
                className="pos-btn-secondary"
                onClick={() => setOpenBillSearch("")}
              >
                Clear
              </button>
            </div>
          </form>

          <div className="billing-card-list">
            {filteredOpenBills.map((bill) => {
              const productTags = String(bill.product_names || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
                .slice(0, 3)

              return (
                <button
                  key={bill.id}
                  type="button"
                  className={`billing-card ${activeBillId === bill.id ? "active" : ""}`}
                  onClick={() => openBillTab(bill.id)}
                >
                  <div className="billing-card-header">
                    <div>
                      <strong>{bill.customer_name || "Walk-in"}</strong>
                      <p className="billing-card-meta">{bill.invoice_no}</p>
                    </div>
                    <span className={`billing-pill ${bill.status?.toLowerCase()}`}>
                      {bill.status}
                    </span>
                  </div>
                  <div className="billing-card-body">
                    <p>Top items:</p>
                    <div className="billing-card-tags">
                      {productTags.length > 0
                        ? productTags.map((name, index) => (
                            <span key={`${bill.id}-prod-${index}`}>{name}</span>
                          ))
                        : "No items yet"}
                    </div>
                  </div>
                  <div className="billing-card-footer">
                    <span>Total: Rs. {formatCurrency(bill.total_amount)}</span>
                    <span>Balance: Rs. {formatCurrency(bill.balance_amount)}</span>
                  </div>
                </button>
              )
            })}

            {filteredOpenBills.length === 0 && (
              <div className="billing-empty">No open bills right now.</div>
            )}
          </div>
        </aside>

        <section className="billing-panel">
          <div className="billing-tabs">
            {billTabs.length === 0 && (
              <div className="billing-empty">Select a bill to start or create a new bill.</div>
            )}
            {billTabs.map((billId) => {
              const draft = billDrafts[billId]
              return (
                <div
                  key={billId}
                  className={`billing-tab ${activeBillId === billId ? "active" : ""}`}
                >
                  <button type="button" onClick={() => setActiveBillId(billId)}>
                    {draft?.invoice_no || `Bill ${billId}`}
                  </button>
                  <button
                    type="button"
                    className="billing-tab-close"
                    onClick={() => handleCloseTab(billId)}
                  >
                    x
                  </button>
                </div>
              )
            })}
          </div>

          {activeDraft && (
            <BillEditor
              draft={activeDraft}
              onDraftChange={handleDraftChange}
              onSave={() => handleSaveBill(activeDraft)}
              onComplete={() => handleCompleteBill(activeDraft)}
              onCancel={() => handleCancelBill(activeDraft)}
              onDelete={() => handleDeleteBill(activeDraft)}
              onAfterComplete={() => handleCloseTab(activeDraft.id)}
              products={products}
              canDeleteBill={hasPermission("delete_bill_records")}
            />
          )}
        </section>
      </div>
    </div>
  )
}




















