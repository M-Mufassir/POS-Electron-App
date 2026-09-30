import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import BillDetailsModal from "./components/BillDetailsModal"
import StatTile from "./components/StatTile"
import RevenueLineChart from "./components/RevenueLineChart"
import BreakdownBarChart from "./components/BreakdownBarChart"
import { useAuth } from "../../context/AuthContext"
import { useSettings } from "../../context/SettingsContext"
import { getChartPalette } from "../../utils/chartPalette"
import { formatAppDateTime } from "../../utils/dateTime"

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return "0.00"
  return amount.toFixed(2)
}

const toDateInputValue = (date) => date.toISOString().slice(0, 10)

const DATE_PRESETS = [
  { key: "today", label: "Today", days: 0 },
  { key: "7d", label: "Last 7 Days", days: 6 },
  { key: "30d", label: "Last 30 Days", days: 29 },
  { key: "90d", label: "Last 90 Days", days: 89 },
]

const defaultFilters = () => {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
    status: "ALL",
    customer_name: "",
  }
}

export default function Analysis() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { settings } = useSettings()
  const currencySymbol = settings.currency_symbol || "Rs."
  const palette = useMemo(() => getChartPalette(settings.theme_preset), [settings.theme_preset])
  const canDeleteBillRecords = hasPermission("delete_bill_records")

  const [filters, setFilters] = useState(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchAnalysis = useCallback(async (nextFilters, isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    try {
      const data = await window.api.getBillingAnalysis(nextFilters)
      setAnalysis(data)
    } catch (error) {
      console.error("Failed to load billing analysis:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalysis(appliedFilters, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyFilters = (nextFilters) => {
    setAppliedFilters(nextFilters)
    fetchAnalysis(nextFilters, false)
  }

  const handlePreset = (preset) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - preset.days)
    const next = { ...filters, from: toDateInputValue(from), to: toDateInputValue(to) }
    setFilters(next)
    applyFilters(next)
  }

  const handleSubmitFilters = (event) => {
    event.preventDefault()
    applyFilters(filters)
  }

  const handleClearFilters = () => {
    const next = defaultFilters()
    setFilters(next)
    applyFilters(next)
  }

  const openBillDetails = async (billId) => {
    try {
      const bill = await window.api.getBillById(billId)
      if (bill) setSelectedBill(bill)
    } catch (error) {
      console.error("Failed to load bill details:", error)
    }
  }

  const handleDeleteBill = async (event, billId) => {
    event.stopPropagation()
    const shouldDelete = window.confirm("Delete this bill? This cannot be undone.")
    if (!shouldDelete) return

    setDeletingId(billId)
    try {
      await window.api.deleteBill(billId)
      await fetchAnalysis(appliedFilters, false)
    } catch (error) {
      console.error("Failed to delete bill:", error)
      alert(error?.message || "Failed to delete bill.")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="pos-container flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading analysis...</div>
        </div>
      </div>
    )
  }

  const summary = analysis?.summary || {
    totalSales: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalBills: 0,
    averageBillValue: 0,
  }
  const bills = analysis?.bills || []
  const dailyRevenue = analysis?.dailyRevenue || []
  const statusBreakdown = analysis?.statusBreakdown || []
  const paymentMethodBreakdown = analysis?.paymentMethodBreakdown || []

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Analysis</h1>
          <p className="pos-section-subtitle">
            Filter billing history to see income, outstanding balances, and trends.
          </p>
        </div>
        <div className="billing-header-actions">
          <button className="pos-btn-secondary" onClick={() => window.print()}>
            Print Report
          </button>
          <button className="pos-btn-secondary" onClick={() => navigate("/billing")}>
            Back To Billing
          </button>
        </div>
      </div>

      <div className="page-body overflow-y-auto">
        <div className="page-toolbar">
          <div className="analysis-preset-row">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className="pos-btn-secondary"
                onClick={() => handlePreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <form className="page-search-row analysis-filter-row" onSubmit={handleSubmitFilters}>
            <div className="page-search-group">
              <label className="pos-label">From</label>
              <input
                type="date"
                className="pos-input"
                value={filters.from}
                max={filters.to}
                onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
              />
            </div>
            <div className="page-search-group">
              <label className="pos-label">To</label>
              <input
                type="date"
                className="pos-input"
                value={filters.to}
                min={filters.from}
                onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
              />
            </div>
            <div className="page-search-group page-search-filter">
              <label className="pos-label">Status</label>
              <select
                className="pos-input"
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="page-search-group">
              <label className="pos-label">Customer</label>
              <input
                type="text"
                className="pos-input"
                placeholder="Search by customer name"
                value={filters.customer_name}
                onChange={(event) => setFilters((prev) => ({ ...prev, customer_name: event.target.value }))}
              />
            </div>
            <div className="page-search-actions">
              <button type="submit" className="pos-btn-primary">
                Apply
              </button>
              <button type="button" className="pos-btn-secondary" onClick={handleClearFilters}>
                Reset
              </button>
            </div>
          </form>

          {refreshing ? <div className="page-filter-note">Refreshing…</div> : null}
        </div>

        <div className="page-summary-grid">
          <StatTile label="Total sales" value={`${currencySymbol} ${formatCurrency(summary.totalSales)}`} />
          <StatTile label="Total collected" value={`${currencySymbol} ${formatCurrency(summary.totalCollected)}`} />
          <StatTile label="Outstanding" value={`${currencySymbol} ${formatCurrency(summary.totalOutstanding)}`} />
          <StatTile label="Total bills" value={summary.totalBills} />
          <StatTile label="Average bill value" value={`${currencySymbol} ${formatCurrency(summary.averageBillValue)}`} />
        </div>

        <div className="pos-card">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Sales vs Collected</h3>
          <p className="text-sm text-slate-500 mb-4">Daily totals for the selected range (cancelled bills excluded).</p>
          <RevenueLineChart data={dailyRevenue} palette={palette} currencySymbol={currencySymbol} />
        </div>

        <div className="analysis-breakdown-grid">
          <div className="pos-card">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">By Status</h3>
            <p className="text-sm text-slate-500 mb-4">Total invoice value per status.</p>
            <BreakdownBarChart
              items={statusBreakdown}
              palette={palette}
              formatValue={(value) => `${currencySymbol} ${formatCurrency(value)}`}
              emptyLabel="No bills in this date range yet."
            />
          </div>
          <div className="pos-card">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">By Payment Method</h3>
            <p className="text-sm text-slate-500 mb-4">Amount collected per payment method.</p>
            <BreakdownBarChart
              items={paymentMethodBreakdown}
              palette={palette}
              formatValue={(value) => `${currencySymbol} ${formatCurrency(value)}`}
              emptyLabel="No payments recorded in this date range yet."
            />
          </div>
        </div>

        <div className="pos-card bills-list-card">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            Bills ({bills.length})
          </h3>
          <div className="bills-list-table-wrap">
            <table className="pos-table sticky-header">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Updated</th>
                  {canDeleteBillRecords ? <th></th> : null}
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} onClick={() => openBillDetails(bill.id)} className="cursor-pointer">
                    <td className="font-semibold">{bill.invoice_no}</td>
                    <td>{bill.customer_name || "Walk-in"}</td>
                    <td>
                      <span className={`billing-pill ${bill.status?.toLowerCase()}`}>{bill.status}</span>
                    </td>
                    <td>{currencySymbol} {formatCurrency(bill.total_amount)}</td>
                    <td>{currencySymbol} {formatCurrency(bill.paid_amount)}</td>
                    <td>{currencySymbol} {formatCurrency(bill.balance_amount)}</td>
                    <td>{formatAppDateTime(bill.updated_at)}</td>
                    {canDeleteBillRecords ? (
                      <td>
                        <button
                          className="pos-btn-danger"
                          onClick={(event) => handleDeleteBill(event, bill.id)}
                          disabled={deletingId === bill.id}
                        >
                          {deletingId === bill.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td colSpan={canDeleteBillRecords ? 8 : 7} className="text-center text-gray-500 py-6">
                      No bills match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedBill ? <BillDetailsModal bill={selectedBill} onClose={() => setSelectedBill(null)} /> : null}
    </div>
  )
}
