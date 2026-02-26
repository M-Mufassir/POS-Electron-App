const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  addProduct: (product) => ipcRenderer.invoke('add-product', product),
  getAllProducts: () => ipcRenderer.invoke('get-all-products'),
  getProductById: (id) => ipcRenderer.invoke('get-product-by-id', id)
})