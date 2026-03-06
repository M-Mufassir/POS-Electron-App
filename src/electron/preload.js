const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  addProduct: (product) => ipcRenderer.invoke('add-product', product),
  getAllProducts: () => ipcRenderer.invoke('get-all-products'),
  getProductById: (id) => ipcRenderer.invoke('get-product-by-id', id),
  updateProduct: (id, product) => ipcRenderer.invoke('update-product', { id, product }),
  deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
  inactivateProduct: (id) => ipcRenderer.invoke('inactivate-product', id),
  getAllCategories: () => ipcRenderer.invoke('get-all-categories'),
  getCategoriesWithProductCounts: () => ipcRenderer.invoke('get-categories-with-product-counts'),
  addCategory: (category) => ipcRenderer.invoke('add-category', category),
  getAllUnits: () => ipcRenderer.invoke('get-all-units'),
  getUnitsWithProductCounts: () => ipcRenderer.invoke('get-units-with-product-counts'),
  addUnit: (unit) => ipcRenderer.invoke('add-unit', unit),

  addProductCategory: (productId, categoryId) => ipcRenderer.invoke('add-product-category', productId, categoryId),
  getProductCategoriesByProductId: (productId) => ipcRenderer.invoke('get-product-categories-by-product-id', productId),
  removeProductCategory: (productId, categoryId) => ipcRenderer.invoke('remove-product-category', productId, categoryId),
  getBarcodesByProductId: (productId) => ipcRenderer.invoke('get-barcodes-by-product-id', productId),
  getAssignableUnitsByProductId: (productId) => ipcRenderer.invoke('get-assignable-units-by-product-id', productId),
  addBarcode: (barcodeData) => ipcRenderer.invoke('add-barcode', barcodeData),
  updateBarcode: (id, barcode) => ipcRenderer.invoke('update-barcode', { id, barcode }),
  deleteBarcode: (id) => ipcRenderer.invoke('delete-barcode', id),
  
})
