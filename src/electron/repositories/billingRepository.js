import { allQuery, getQuery, runQuery } from "./dbUtils.js"

export const insertBill = (invoiceNo, customerName, userId = null) => {
  return runQuery(
    `INSERT INTO bills (invoice_no, customer_name, user_id, status, subtotal, discount_value, total_amount, paid_amount, balance_amount)
     VALUES (?, ?, ?, 'OPEN', 0, 0, 0, 0, 0)`,
    [invoiceNo, customerName, userId],
  )
}

export const selectBillById = (billId) => {
  return getQuery(`SELECT * FROM bills WHERE id = ?`, [billId])
}

export const selectBillItemsByBillId = (billId) => {
  return allQuery(
    `SELECT
        bi.id,
        bi.bill_id,
        bi.product_id,
        bi.unit_id,
        bi.barcode_id,
        bi.quantity,
        bi.unit_price,
        bi.subtotal,
        p.name AS product_name,
        u.name AS unit_name,
        u.symbol AS unit_symbol
     FROM bill_items bi
     JOIN products p ON p.id = bi.product_id
     JOIN units u ON u.id = bi.unit_id
     WHERE bi.bill_id = ?
     ORDER BY bi.id ASC`,
    [billId],
  )
}

export const selectOpenBillsSummary = () => {
  return allQuery(
    `SELECT
        b.id,
        b.invoice_no,
        b.customer_name,
        b.status,
        b.total_amount,
        b.balance_amount,
        b.updated_at,
        GROUP_CONCAT(p.name, ', ') AS product_names
     FROM bills b
     LEFT JOIN bill_items bi ON bi.bill_id = b.id
     LEFT JOIN products p ON p.id = bi.product_id
     WHERE b.status IN ('OPEN', 'PARTIAL')
     GROUP BY b.id
     ORDER BY b.updated_at DESC`,
  )
}

export const selectAllBills = () => {
  return allQuery(
    `SELECT
        id,
        invoice_no,
        customer_name,
        status,
        subtotal,
        discount_type,
        discount_value,
        total_amount,
        paid_amount,
        balance_amount,
        created_at,
        updated_at
     FROM bills
     ORDER BY created_at DESC`,
  )
}

export const selectProductPricing = (productId) => {
  return getQuery(
    `SELECT id, name, base_price, base_unit_id, stock_base_qty, status
     FROM products
     WHERE id = ?`,
    [productId],
  )
}

export const selectUnitMultiplier = (productId, unitId) => {
  return getQuery(
    `SELECT conversion_multiplier
     FROM product_units
     WHERE product_id = ? AND unit_id = ?`,
    [productId, unitId],
  )
}

export const selectBillState = (billId) => {
  return getQuery(
    `SELECT id, status, inventory_applied, invoice_no, user_id
     FROM bills
     WHERE id = ?`,
    [billId],
  )
}

export const updateBillById = (billId, data) => {
  return runQuery(
    `UPDATE bills
     SET customer_name = ?,
         status = ?,
         subtotal = ?,
         discount_type = ?,
         discount_value = ?,
         total_amount = ?,
         paid_amount = ?,
         balance_amount = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [
      data.customer_name,
      data.status,
      data.subtotal,
      data.discount_type,
      data.discount_value,
      data.total_amount,
      data.paid_amount,
      data.balance_amount,
      billId,
    ],
  )
}

export const updateBillStatus = (billId, status) => {
  return runQuery(
    `UPDATE bills
     SET status = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [status, billId],
  )
}

export const deleteBillById = (billId) => {
  return runQuery(`DELETE FROM bills WHERE id = ?`, [billId])
}

export const deleteAllBills = () => {
  return runQuery(`DELETE FROM bills`)
}

export const deleteBillItemsByBillId = (billId) => {
  return runQuery(`DELETE FROM bill_items WHERE bill_id = ?`, [billId])
}

export const insertBillItem = (billId, item) => {
  return runQuery(
    `INSERT INTO bill_items
       (bill_id, product_id, unit_id, barcode_id, quantity, unit_price, subtotal)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      billId,
      item.product_id,
      item.unit_id,
      item.barcode_id,
      item.quantity,
      item.unit_price,
      item.subtotal,
    ],
  )
}

export const updateProductStock = (productId, quantity) => {
  return runQuery(
    `UPDATE products
     SET stock_base_qty = COALESCE(stock_base_qty, 0) - ?,
         updated_at = datetime('now')
     WHERE id = ?
       AND COALESCE(stock_base_qty, 0) >= ?`,
    [quantity, productId, quantity],
  )
}

export const markBillInventoryApplied = (billId) => {
  return runQuery(`UPDATE bills SET inventory_applied = 1 WHERE id = ?`, [billId])
}

export const selectBarcodeDetails = (barcodeValue) => {
  return getQuery(
    `SELECT
        b.id AS barcode_id,
        b.product_id,
        b.unit_id,
        p.name AS product_name,
        p.base_price,
        p.base_unit_id,
        p.status AS product_status,
        p.stock_base_qty,
        u.name AS unit_name,
        u.symbol AS unit_symbol
     FROM barCodes b
     JOIN products p ON p.id = b.product_id
     JOIN units u ON u.id = b.unit_id
     WHERE b.barcode = ?`,
    [barcodeValue],
  )
}
