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
    title: 'Inventory System',
    autoHideMenuBar: true, // hides menu
    frame: false, // custom in-app title bar (src/ui/components/TitleBar.jsx) replaces the OS chrome
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

  const notifyMaximizedState = () => {
    mainWindow.webContents.send('window-maximized-changed', mainWindow.isMaximized())
  }
  mainWindow.on('maximize', notifyMaximizedState)
  mainWindow.on('unmaximize', notifyMaximizedState)

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5123')
    return
  }

  const rendererPath = path.join(__dirname, '../../dist-react/index.html')
  mainWindow.loadFile(rendererPath)
}

function registerWindowControlHandlers() {
  ipcMain.handle('window-minimize', () => mainWindow?.minimize())
  ipcMain.handle('window-maximize-toggle', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })
  ipcMain.handle('window-close', () => mainWindow?.close())
  ipcMain.handle('window-is-maximized', () => Boolean(mainWindow?.isMaximized()))
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
registerWindowControlHandlers()

