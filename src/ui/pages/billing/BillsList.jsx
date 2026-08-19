import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import BillDetailsModal from "./components/BillDetailsModal"
import { useAuth } from "../../context/AuthContext"
import { useSettings } from "../../context/SettingsContext"
import { formatAppDateTime } from "../../utils/dateTime"

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return "0.00"
  return amount.toFixed(2)
}

export default function BillsList() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { settings } = useSettings()
  const currencySymbol = settings.currency_symbol || "Rs."
  const canDeleteBillRecords = hasPermission("delete_bill_records")
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchBills = async () => {
    setLoading(true)
    try {
      const data = await window.api.getAllBills()
      setBills(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch bills:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBills()
  }, [])

  const filteredBills = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return bills.filter((bill) => {
      const matchesSearch =
        !term ||
        String(bill.invoice_no || "").toLowerCase().includes(term) ||
        String(bill.customer_name || "").toLowerCase().includes(term) ||
        String(bill.status || "").toLowerCase().includes(term)

      const matchesStatus =
        statusFilter === "all" || String(bill.status || "").toUpperCase() === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [bills, searchTerm, statusFilter])

  const billSummary = useMemo(() => {
    const paidBills = bills.filter((bill) => bill.status === "PAID").length
    const openBills = bills.filter((bill) => bill.status === "OPEN").length
    const partialBills = bills.filter((bill) => bill.status === "PARTIAL").length
    const totalRevenue = bills.reduce((sum, bill) => sum + Number(bill.total_amount || 0), 0)
    const outstanding = bills.reduce((sum, bill) => sum + Number(bill.balance_amount || 0), 0)

    return {
      totalBills: bills.length,
      paidBills,
      openBills,
      partialBills,
      totalRevenue,
      outstanding,
    }
  }, [bills])

  const openBillDetails = async (billId) => {
    try {
      const bill = await window.api.getBillById(billId)
      if (bill) {
        setSelectedBill(bill)
      }
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
      await fetchBills()
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
          <div className="text-lg text-gray-600">Loading bills list...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1 className="pos-section-title">Bills List</h1>
          <p className="pos-section-subtitle">
            Search invoice history, monitor outstanding balances, and review bill status quickly.
          </p>
        </div>
        <div className="billing-header-actions">
          <button className="pos-btn-secondary" onClick={() => navigate("/billing")}>
            Back To Billing
          </button>
        </div>
      </div>

      <div className="page-body overflow-y-auto">
        <div className="page-summary-grid">
          <div className="page-summary-card">
            <span className="page-summary-label">Total Bills</span>
            <strong>{billSummary.totalBills}</strong>
          </div>
          <div className="page-summary-card success">
            <span className="page-summary-label">Paid</span>
            <strong>{billSummary.paidBills}</strong>
          </div>
          <div className="page-summary-card warning">
            <span className="page-summary-label">Open</span>
            <strong>{billSummary.openBills}</strong>
          </div>
          <div className="page-summary-card info">
            <span className="page-summary-label">Partial</span>
            <strong>{billSummary.partialBills}</strong>
          </div>
          <div className="page-summary-card accent">
            <span className="page-summary-label">Revenue</span>
            <strong>{currencySymbol} {formatCurrency(billSummary.totalRevenue)}</strong>
          </div>
          <div className="page-summary-card danger">
            <span className="page-summary-label">Outstanding</span>
            <strong>{currencySymbol} {formatCurrency(billSummary.outstanding)}</strong>
          </div>
        </div>

        <div className="page-toolbar">
          <form className="page-search-row" onSubmit={(event) => event.preventDefault()}>
            <div className="page-search-group">
              <label className="pos-label">Search Bills</label>
              <input
                type="text"
                className="pos-input"
                placeholder="Search by invoice, customer, or status"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="page-search-group page-search-filter">
              <label className="pos-label">Status</label>
              <select
                className="pos-input"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="page-search-actions">
              <button type="submit" className="pos-btn-primary">
                Search
              </button>
              <button
                type="button"
                className="pos-btn-secondary"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                }}
              >
                Clear
              </button>
            </div>
          </form>

          <div className="page-toolbar-actions">
            <div className="page-filter-note">
              Showing {filteredBills.length} of {bills.length} bills
            </div>
          </div>
        </div>

        <div className="pos-card bills-list-card">
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
                {filteredBills.map((bill) => (
                  <tr key={bill.id} onClick={() => openBillDetails(bill.id)} className="cursor-pointer">
                    <td className="font-semibold">{bill.invoice_no}</td>
                    <td>{bill.customer_name || "Walk-in"}</td>
                    <td>
                      <span className={`billing-pill ${bill.status?.toLowerCase()}`}>
                        {bill.status}
                      </span>
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
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan={canDeleteBillRecords ? 8 : 7} className="text-center text-gray-500 py-6">
                      No bills match the current search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedBill ? (
        <BillDetailsModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      ) : null}
    </div>
  )
}




