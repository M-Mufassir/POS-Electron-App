import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'
import { initializeDatabase } from './database/db.js'
import { addProduct, getAllProducts } from './database/productService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true, // hides menu
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.loadURL('http://localhost:5123')
}

app.whenReady().then(() => {
  initializeDatabase()   // 🔥 Initialize DB once
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/* ================= IPC ================= */

ipcMain.handle('add-product', async (event, product) => {
  return await addProduct(product)
})

ipcMain.handle('get-all-products', async () => {
  return await getAllProducts()
})

ipcMain.handle('get-product-by-id', async (event, id) => {
  const { getProductById } = await import('./database/productService.js')
  return await getProductById(id)
})

ipcMain.handle('update-product', async (event, { id, product }) => {
  const { updateProduct } = await import('./database/productService.js')
  return await updateProduct(id, product)
})

ipcMain.handle('delete-product', async (event, id) => {
  const { deleteProduct } = await import('./database/productService.js')
  return await deleteProduct(id)
})

ipcMain.handle('inactivate-product', async (event, id) => {
  const { inactivateProduct } = await import('./database/productService.js')
  return await inactivateProduct(id)
})

ipcMain.handle('get-all-categories', async () => {
  const { getAllCategories } = await import('./database/categoryService.js')
  return await getAllCategories()
})

ipcMain.handle('get-all-units', async () => {
  const { getAllUnits } = await import('./database/unitService.js')
  return await getAllUnits()
})

ipcMain.handle('get-units-with-product-counts', async () => {
  const { getUnitsWithProductCounts } = await import('./database/unitService.js')
  return await getUnitsWithProductCounts()
})

ipcMain.handle('add-unit', async (event, unit) => {
  const { addUnit } = await import('./database/unitService.js')
  return await addUnit(unit)
})

ipcMain.handle('get-categories-with-product-counts', async () => {
  const { getCategoriesWithProductCounts } = await import('./database/categoryService.js')
  return await getCategoriesWithProductCounts()
})

ipcMain.handle('add-category', async (event, category) => {
  const { addCategory } = await import('./database/categoryService.js')
  return await addCategory(category)
})

ipcMain.handle('add-product-category', async (event, productId, categoryId) => {
  const { addProductCategory } = await import('./database/productService.js')
  return await addProductCategory(productId, categoryId)
})

ipcMain.handle('get-product-categories-by-product-id', async (event, productId) => {
  const { getProductCategoriesByProductId } = await import('./database/productService.js')
  return await getProductCategoriesByProductId(productId)
})

ipcMain.handle('remove-product-category', async (event, productId, categoryId) => {
  const { removeProductCategory } = await import('./database/productService.js')
  return await removeProductCategory(productId, categoryId)
})

ipcMain.handle('get-barcodes-by-product-id', async (event, productId) => {
  const { getBarcodesByProductId } = await import('./database/barcodeService.js')
  return await getBarcodesByProductId(productId)
})

ipcMain.handle('get-assignable-units-by-product-id', async (event, productId) => {
  const { getAssignableUnitsByProductId } = await import('./database/barcodeService.js')
  return await getAssignableUnitsByProductId(productId)
})

ipcMain.handle('add-barcode', async (event, barcodeData) => {
  const { addBarcode } = await import('./database/barcodeService.js')
  return await addBarcode(barcodeData)
})

ipcMain.handle('update-barcode', async (event, { id, barcode }) => {
  const { updateBarcode } = await import('./database/barcodeService.js')
  return await updateBarcode(id, barcode)
})

ipcMain.handle('delete-barcode', async (event, id) => {
  const { deleteBarcode } = await import('./database/barcodeService.js')
  return await deleteBarcode(id)
})

