const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  addProduct: (product) => ipcRenderer.invoke('add-product', product),
  getAllProducts: () => ipcRenderer.invoke('get-all-products'),
  getProductById: (id) => ipcRenderer.invoke('get-product-by-id', id),
  updateProduct: (id, product) => ipcRenderer.invoke('update-product', { id, product }),
  deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
  inactivateProduct: (id) => ipcRenderer.invoke('inactivate-product', id),
  getAllCategories: () => ipcRenderer.invoke('get-all-categories'),
  getAllUnits: () => ipcRenderer.invoke('get-all-units')
})