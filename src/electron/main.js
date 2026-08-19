import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'
import { initializeDatabase } from './database/db.js'
import { registerIpcHandlers } from './ipc/registerHandlers.js'
import { isDev } from './utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true, // hides menu
    show: false, // shown on 'ready-to-show', already maximized, to avoid a small-then-big flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5123')
    return
  }

  const rendererPath = path.join(__dirname, '../../dist-react/index.html')
  mainWindow.loadFile(rendererPath)
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
registerIpcHandlers(ipcMain)

