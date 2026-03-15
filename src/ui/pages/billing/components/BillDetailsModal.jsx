import React from "react"

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return "0.00"
  return amount.toFixed(2)
}

const BillDetailsModal = ({ bill, onClose }) => {
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
                <span>Rs. {formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="receipt-total">
            <div className="receipt-row">
              <span>Subtotal</span>
              <strong>Rs. {formatCurrency(bill.subtotal)}</strong>
            </div>
            <div className="receipt-row">
              <span>Discount</span>
              <strong>Rs. {formatCurrency(bill.discount_value || 0)}</strong>
            </div>
            <div className="receipt-row">
              <span>Total</span>
              <strong>Rs. {formatCurrency(bill.total_amount)}</strong>
            </div>
            <div className="receipt-row">
              <span>Paid</span>
              <strong>Rs. {formatCurrency(bill.paid_amount)}</strong>
            </div>
            <div className="receipt-row">
              <span>Balance</span>
              <strong>Rs. {formatCurrency(bill.balance_amount)}</strong>
            </div>
          </div>

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
