import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const tempDataDir = path.join(process.cwd(), "tmp", "production-smoke-db")
fs.rmSync(tempDataDir, { force: true, recursive: true })
fs.mkdirSync(tempDataDir, { recursive: true })

process.env.NODE_ENV = "test"
process.env.POS_DATA_DIR = tempDataDir

const { initializeDatabase, getDB } = await import("../electron/database/db.js")
const { addUnit } = await import("../electron/services/unitService.js")
const { addCategory } = await import("../electron/services/categoryService.js")
const { addProduct, getProductById, updateProduct } = await import("../electron/services/productService.js")
const { addBarcode } = await import("../electron/services/barcodeService.js")
const {
  createBill,
  deleteAllBills,
  deleteBill,
  cancelBill,
  getBillById,
  saveBill,
} = await import("../electron/services/billingService.js")
const { createUser, getAuthBootstrapState, listRoles } = await import("../electron/services/authService.js")

initializeDatabase()

const closeDatabase = async () => {
  const db = getDB()
  if (!db) return

  await new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

const expectError = async (label, fn, pattern) => {
  let thrown = null
  try {
    await fn()
  } catch (error) {
    thrown = error
  }

  assert.ok(thrown, `${label}: expected an error to be thrown`)
  if (pattern) {
    assert.match(String(thrown.message || thrown), pattern, `${label}: unexpected error message`)
  }
}

try {
  const bootstrap = await getAuthBootstrapState()
  assert.equal(bootstrap.can_use_default_admin, true, "bootstrap admin should be available before users exist")

  const roles = await listRoles()
  const adminRole = roles.find((role) => role.name === "Admin")
  const cashierRole = roles.find((role) => role.name === "Cashier")

  assert.ok(adminRole, "admin role should exist")
  assert.ok(cashierRole, "cashier role should exist")

  const adminUser = await createUser({
    username: "prod-admin",
    password: "Admin@123",
    role_id: adminRole.id,
  })
  const cashierUser = await createUser({
    username: "prod-cashier",
    password: "Cashier@123",
    role_id: cashierRole.id,
  })

  const piece = await addUnit({ name: "Piece", symbol: "pc", unit_type: "COUNT", base_multiplier: 1 })
  const box = await addUnit({ name: "Box", symbol: "box", unit_type: "COUNT", base_multiplier: 1 })
  const grocery = await addCategory({ name: "Grocery", description: "Smoke test category" })

  const createdProduct = await addProduct({
    code: "SMOKE-001",
    name: "Milk Pack",
    description: "Smoke test product",
    base_price: 100,
    base_unit_id: piece.id,
    stock_base_qty: 20,
  })

  await updateProduct(createdProduct.id, {
    code: "SMOKE-001",
    name: "Milk Pack",
    description: "Smoke test product",
    base_price: 100,
    base_unit_id: piece.id,
    stock_base_qty: 20,
    status: 1,
    categories: [grocery.id],
    units: [{ unit_id: box.id, conversion_multiplier: 6 }],
  })

  await addBarcode({ product_id: createdProduct.id, unit_id: piece.id, barcode: "990001" })
  await addBarcode({ product_id: createdProduct.id, unit_id: box.id, barcode: "990002" })

  const billOne = await createBill({ customer_name: "Walk-in" }, cashierUser)
  const billTwo = await createBill({ customer_name: "Walk-in" }, cashierUser)
  assert.notEqual(billOne.invoice_no, billTwo.invoice_no, "invoice numbers should be unique")

  const persistedBill = await getBillById(billOne.id)
  assert.equal(persistedBill.user_id, cashierUser.id, "bill should retain the creating user id")

  const partialResult = await saveBill({
    id: billOne.id,
    customer_name: "Walk-in",
    discount_type: null,
    discount_value: 0,
    paid_amount: 150,
    items: [
      {
        product_id: createdProduct.id,
        unit_id: piece.id,
        quantity: 3,
      },
    ],
  })

  assert.equal(partialResult.status, "PARTIAL", "bill should become partial after partial payment")

  const updatedProduct = await getProductById(createdProduct.id)
  assert.equal(Number(updatedProduct.stock_base_qty), 17, "stock should be deducted exactly once when inventory is applied")

  await expectError(
    "editing an inventory-applied bill",
    () => saveBill({
      id: billOne.id,
      customer_name: "Walk-in",
      paid_amount: 150,
      items: [
        {
          product_id: createdProduct.id,
          unit_id: piece.id,
          quantity: 4,
        },
      ],
    }),
    /Items cannot be changed after inventory has been applied/,
  )

  await expectError(
    "cancelling an inventory-applied bill",
    () => cancelBill(billOne.id),
    /cannot be cancelled/i,
  )

  await expectError(
    "deleting an inventory-applied bill",
    () => deleteBill(billOne.id),
    /cannot be deleted/i,
  )

  const stockBill = await createBill({}, adminUser)
  await expectError(
    "overselling stock",
    () => saveBill({
      id: stockBill.id,
      paid_amount: 0,
      items: [
        {
          product_id: createdProduct.id,
          unit_id: box.id,
          quantity: 4,
        },
      ],
    }),
    /does not have enough stock/i,
  )

  const invalidUnitBill = await createBill({}, adminUser)
  await expectError(
    "using a unit that is not assigned to the product",
    () => saveBill({
      id: invalidUnitBill.id,
      paid_amount: 0,
      items: [
        {
          product_id: createdProduct.id,
          unit_id: 9999,
          quantity: 1,
        },
      ],
    }),
    /Selected unit is not assigned to this product/,
  )

  const paymentOnlyBill = await createBill({}, adminUser)
  await expectError(
    "taking payment without items",
    () => saveBill({
      id: paymentOnlyBill.id,
      paid_amount: 10,
      items: [],
    }),
    /Add at least one item before taking payment/,
  )

  await updateProduct(createdProduct.id, {
    code: "SMOKE-001",
    name: "Milk Pack",
    description: "Smoke test product",
    base_price: 100,
    base_unit_id: piece.id,
    stock_base_qty: 17,
    status: 0,
    categories: [grocery.id],
    units: [{ unit_id: box.id, conversion_multiplier: 6 }],
  })

  const inactiveBill = await createBill({}, adminUser)
  await expectError(
    "billing an inactive product",
    () => saveBill({
      id: inactiveBill.id,
      paid_amount: 0,
      items: [
        {
          product_id: createdProduct.id,
          unit_id: piece.id,
          quantity: 1,
        },
      ],
    }),
    /inactive and cannot be billed/i,
  )

  await expectError(
    "bulk bill deletion",
    () => deleteAllBills(),
    /disabled for production safety/i,
  )

  console.log("Production smoke test passed.")
} finally {
  await closeDatabase()
}
