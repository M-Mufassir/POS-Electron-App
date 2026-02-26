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