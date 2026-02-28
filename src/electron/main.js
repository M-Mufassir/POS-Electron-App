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
  const { getAllCategories } = await import('./database/unitService.js')
  return await getAllCategories()
})

ipcMain.handle('get-all-units', async () => {
  const { getAllUnits } = await import('./database/productService.js')
  return await getAllUnits()
})