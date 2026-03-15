import { useEffect, useState } from "react"
import BillDetailsModal from "./components/BillDetailsModal"

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return "0.00"
  return amount.toFixed(2)
}

export default function BillsList() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deletingAll, setDeletingAll] = useState(false)

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

  const handleDeleteAll = async () => {
    const shouldDelete = window.confirm("Delete ALL bills? This cannot be undone.")
    if (!shouldDelete) return

    setDeletingAll(true)
    try {
      await window.api.deleteAllBills()
      await fetchBills()
    } catch (error) {
      console.error("Failed to delete all bills:", error)
      alert(error?.message || "Failed to delete all bills.")
    } finally {
      setDeletingAll(false)
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
          <h1 className="pos-section-title">All Bills</h1>
          <p className="pos-section-subtitle">Invoice history and references</p>
        </div>
        <button className="pos-btn-danger" onClick={handleDeleteAll} disabled={deletingAll}>
          {deletingAll ? "Deleting..." : "Delete All"}
        </button>
      </div>

      <div className="p-6 flex-1 overflow-hidden">
        <div className="pos-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} onClick={() => openBillDetails(bill.id)} className="cursor-pointer">
                    <td className="font-semibold">{bill.invoice_no}</td>
                    <td>{bill.customer_name || "Walk-in"}</td>
                    <td>
                      <span className={`billing-pill ${bill.status?.toLowerCase()}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td>Rs. {formatCurrency(bill.total_amount)}</td>
                    <td>Rs. {formatCurrency(bill.paid_amount)}</td>
                    <td>Rs. {formatCurrency(bill.balance_amount)}</td>
                    <td>{bill.updated_at ? new Date(bill.updated_at).toLocaleString() : "-"}</td>
                    <td>
                      <button
                        className="pos-btn-danger"
                        onClick={(event) => handleDeleteBill(event, bill.id)}
                        disabled={deletingId === bill.id}
                      >
                        {deletingId === bill.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-gray-500 py-6">
                      No bills found yet.
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
