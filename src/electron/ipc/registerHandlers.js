import { dialog } from "electron"
import * as productService from "../services/productService.js"
import * as categoryService from "../services/categoryService.js"
import * as unitService from "../services/unitService.js"
import * as barcodeService from "../services/barcodeService.js"
import * as billingService from "../services/billingService.js"
import * as settingsService from "../services/settingsService.js"
import { registerAuthHandlers, requireAuth, requirePermission } from "./authHandlers.js"

export function registerIpcHandlers(ipcMain) {
  registerAuthHandlers(ipcMain)

  ipcMain.handle("add-product", async (event, product) => {
    requirePermission(event, "manage_products")
    return await productService.addProduct(product)
  })

  ipcMain.handle("get-all-products", async (event) => {
    requireAuth(event)
    return await productService.getAllProducts()
  })

  ipcMain.handle("get-product-by-id", async (event, id) => {
    requireAuth(event)
    return await productService.getProductById(id)
  })

  ipcMain.handle("update-product", async (event, { id, product }) => {
    requirePermission(event, "manage_products")
    return await productService.updateProduct(id, product)
  })

  ipcMain.handle("delete-product", async (event, id) => {
    requirePermission(event, "delete_product")
    return await productService.deleteProduct(id)
  })

  ipcMain.handle("inactivate-product", async (event, id) => {
    requirePermission(event, "manage_products")
    return await productService.inactivateProduct(id)
  })

  ipcMain.handle("add-product-stock", async (event, { id, quantity }) => {
    requirePermission(event, "manage_products")
    return await productService.addProductStock(id, quantity)
  })

  ipcMain.handle("get-all-categories", async (event) => {
    requireAuth(event)
    return await categoryService.getAllCategories()
  })

  ipcMain.handle("get-categories-with-product-counts", async (event) => {
    requireAuth(event)
    return await categoryService.getCategoriesWithProductCounts()
  })

  ipcMain.handle("add-category", async (event, category) => {
    requirePermission(event, "manage_catalog")
    return await categoryService.addCategory(category)
  })

  ipcMain.handle("update-category", async (event, { id, category }) => {
    requirePermission(event, "manage_catalog")
    return await categoryService.updateCategory(id, category)
  })

  ipcMain.handle("deactivate-category", async (event, id) => {
    requirePermission(event, "manage_catalog")
    return await categoryService.deactivateCategory(id)
  })

  ipcMain.handle("reactivate-category", async (event, id) => {
    requirePermission(event, "manage_catalog")
    return await categoryService.reactivateCategory(id)
  })

  ipcMain.handle("get-all-units", async (event) => {
    requireAuth(event)
    return await unitService.getAllUnits()
  })

  ipcMain.handle("get-units-with-product-counts", async (event) => {
    requireAuth(event)
    return await unitService.getUnitsWithProductCounts()
  })

  ipcMain.handle("add-unit", async (event, unit) => {
    requirePermission(event, "manage_catalog")
    return await unitService.addUnit(unit)
  })

  ipcMain.handle("update-unit", async (event, { id, unit }) => {
    requirePermission(event, "manage_catalog")
    return await unitService.updateUnit(id, unit)
  })

  ipcMain.handle("deactivate-unit", async (event, id) => {
    requirePermission(event, "manage_catalog")
    return await unitService.deactivateUnit(id)
  })

  ipcMain.handle("add-product-category", async (event, productId, categoryId) => {
    requirePermission(event, "manage_products")
    return await productService.addProductCategory(productId, categoryId)
  })

  ipcMain.handle("get-product-categories-by-product-id", async (event, productId) => {
    requireAuth(event)
    return await productService.getProductCategoriesByProductId(productId)
  })

  ipcMain.handle("remove-product-category", async (event, productId, categoryId) => {
    requirePermission(event, "manage_products")
    return await productService.removeProductCategory(productId, categoryId)
  })

  ipcMain.handle("get-barcodes-by-product-id", async (event, productId) => {
    requireAuth(event)
    return await barcodeService.getBarcodesByProductId(productId)
  })

  ipcMain.handle("get-assignable-units-by-product-id", async (event, productId) => {
    requireAuth(event)
    return await barcodeService.getAssignableUnitsByProductId(productId)
  })

  ipcMain.handle("add-barcode", async (event, barcodeData) => {
    requirePermission(event, "manage_products")
    return await barcodeService.addBarcode(barcodeData)
  })

  ipcMain.handle("update-barcode", async (event, { id, barcode }) => {
    requirePermission(event, "manage_products")
    return await barcodeService.updateBarcode(id, barcode)
  })

  ipcMain.handle("delete-barcode", async (event, id) => {
    requirePermission(event, "manage_products")
    return await barcodeService.deleteBarcode(id)
  })

  ipcMain.handle("generate-barcode", async (event) => {
    requirePermission(event, "manage_products")
    return await barcodeService.generateBarcode()
  })

  ipcMain.handle("create-bill", async (event, payload) => {
    const user = requireAuth(event)
    return await billingService.createBill(payload, user)
  })

  ipcMain.handle("get-bill-by-id", async (event, id) => {
    requireAuth(event)
    return await billingService.getBillById(id)
  })

  ipcMain.handle("get-open-bills", async (event) => {
    requireAuth(event)
    return await billingService.getOpenBills()
  })

  ipcMain.handle("get-all-bills", async (event) => {
    requireAuth(event)
    return await billingService.getAllBills()
  })

  ipcMain.handle("save-bill", async (event, payload) => {
    requireAuth(event)
    return await billingService.saveBill(payload)
  })

  ipcMain.handle("resolve-barcode", async (event, barcode) => {
    requireAuth(event)
    return await billingService.resolveBarcode(barcode)
  })

  ipcMain.handle("cancel-bill", async (event, billId) => {
    requireAuth(event)
    return await billingService.cancelBill(billId)
  })

  ipcMain.handle("delete-bill", async (event, billId) => {
    requirePermission(event, "delete_bill_records")
    return await billingService.deleteBill(billId)
  })

  ipcMain.handle("delete-all-bills", async (event) => {
    requirePermission(event, "delete_bill_records")
    return await billingService.deleteAllBills()
  })

  ipcMain.handle("get-bill-payments", async (event, billId) => {
    requireAuth(event)
    return await billingService.getPaymentsForBill(billId)
  })

  // Shop branding is shown on the (unauthenticated) login screen too, so
  // reading it does not require a session.
  ipcMain.handle("get-settings", async () => {
    return await settingsService.getSettings()
  })

  ipcMain.handle("get-logo-data-url", async () => {
    return await settingsService.getLogoDataUrl()
  })

  ipcMain.handle("update-settings", async (event, payload) => {
    requirePermission(event, "manage_settings")
    return await settingsService.updateSettings(payload)
  })

  ipcMain.handle("select-logo-file", async (event) => {
    requirePermission(event, "manage_settings")
    const result = await dialog.showOpenDialog({
      title: "Select shop logo",
      properties: ["openFile"],
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"] }],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  ipcMain.handle("upload-logo", async (event, filePath) => {
    requirePermission(event, "manage_settings")
    return await settingsService.saveLogo(filePath)
  })
}
