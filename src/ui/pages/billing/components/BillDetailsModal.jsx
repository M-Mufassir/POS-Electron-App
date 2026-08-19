import React, { useEffect, useState } from "react"
import { useSettings } from "../../../context/SettingsContext"

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return "0.00"
  return amount.toFixed(2)
}

const BillDetailsModal = ({ bill, onClose }) => {
  const { settings } = useSettings()
  const currency = settings.currency_symbol || "Rs."
  const [payments, setPayments] = useState([])

  useEffect(() => {
    let cancelled = false

    const loadPayments = async () => {
      if (!bill?.id) return
      try {
        const data = await window.api.getBillPayments(bill.id)
        if (!cancelled) {
          setPayments(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Failed to load bill payments:", error)
      }
    }

    loadPayments()
    return () => {
      cancelled = true
    }
  }, [bill?.id])

  if (!bill) return null

  return (
    <div className="receipt-overlay">
      <div className="receipt-card bill-detail">
        <div className="receipt-status">Bill Details</div>
        <div className="receipt-body">
          <h3>{bill.invoice_no}</h3>
          <p className="receipt-meta">Customer: {bill.customer_name || "Walk-in"}</p>
          <p className="receipt-meta">Status: {bill.status}</p>

          <div className="receipt-items">
            <div className="receipt-row receipt-head">
              <span>Item</span>
              <span>Qty</span>
              <span>Amount</span>
            </div>
            {(bill.items || []).map((item, index) => (
              <div key={`${item.product_id}-${index}`} className="receipt-row">
                <span>{item.product_name}</span>
                <span>{item.quantity}</span>
                <span>{currency} {formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="receipt-total">
            <div className="receipt-row">
              <span>Subtotal</span>
              <strong>{currency} {formatCurrency(bill.subtotal)}</strong>
            </div>
            <div className="receipt-row">
              <span>Discount</span>
              <strong>{currency} {formatCurrency(bill.discount_value || 0)}</strong>
            </div>
            <div className="receipt-row">
              <span>Tax</span>
              <strong>{currency} {formatCurrency(bill.tax_amount || 0)}</strong>
            </div>
            <div className="receipt-row">
              <span>Total</span>
              <strong>{currency} {formatCurrency(bill.total_amount)}</strong>
            </div>
            <div className="receipt-row">
              <span>Paid</span>
              <strong>{currency} {formatCurrency(bill.paid_amount)}</strong>
            </div>
            <div className="receipt-row">
              <span>Balance</span>
              <strong>{currency} {formatCurrency(bill.balance_amount)}</strong>
            </div>
          </div>

          {payments.length > 0 ? (
            <div className="receipt-total">
              <div className="receipt-row receipt-head">
                <span>Payment History</span>
                <span></span>
              </div>
              {payments.map((payment) => (
                <div key={payment.id} className="receipt-row">
                  <span>
                    {payment.payment_method}
                    {payment.reference_no ? ` (${payment.reference_no})` : ""}
                  </span>
                  <strong>{currency} {formatCurrency(payment.amount)}</strong>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex justify-end mt-4">
            <button className="pos-btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BillDetailsModal
