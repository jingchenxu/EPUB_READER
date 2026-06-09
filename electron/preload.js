const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openEpub: () => {
    return ipcRenderer.invoke('open-epub')
  },
  getBooks: (categoryId) => {
    return ipcRenderer.invoke('get-books', categoryId)
  },
  saveProgress: (data) => {
    return ipcRenderer.invoke('save-progress', data)
  },
  getProgress: (bookId) => {
    return ipcRenderer.invoke('get-progress', bookId)
  },
  addBookmark: (data) => {
    return ipcRenderer.invoke('add-bookmark', data)
  },
  getBookmarks: (bookId) => {
    return ipcRenderer.invoke('get-bookmarks', bookId)
  },
  deleteBookmark: (bookmarkId) => {
    return ipcRenderer.invoke('delete-bookmark', bookmarkId)
  },
  deleteBook: (bookId) => {
    return ipcRenderer.invoke('delete-book', bookId)
  },
  getCategories: () => {
    return ipcRenderer.invoke('get-categories')
  },
  addCategory: (name, color) => {
    return ipcRenderer.invoke('add-category', name, color)
  },
  deleteCategory: (categoryId) => {
    return ipcRenderer.invoke('delete-category', categoryId)
  },
  updateBookCategory: (bookId, categoryId) => {
    return ipcRenderer.invoke('update-book-category', bookId, categoryId)
  },
  exportBook: (bookId) => {
    return ipcRenderer.invoke('export-book', bookId)
  },
  exportNotes: (bookId) => {
    return ipcRenderer.invoke('export-notes', bookId)
  },
  deleteBookCompletely: (bookId) => {
    return ipcRenderer.invoke('delete-book-completely', bookId)
  },
  getAppPath: () => {
    return ipcRenderer.invoke('get-app-path')
  },
  getUserDataPath: () => {
    return ipcRenderer.invoke('get-user-data-path')
  },
  openReaderWindow: (book) => {
    return ipcRenderer.invoke('open-reader-window', book)
  },
  saveAnnotation: (data) => {
    return ipcRenderer.invoke('save-annotation', data)
  },
  getAnnotations: (bookId) => {
    return ipcRenderer.invoke('get-annotations', bookId)
  },
  deleteAnnotation: (annotationId) => {
    return ipcRenderer.invoke('delete-annotation', annotationId)
  },
  getStorageInfo: () => {
    return ipcRenderer.invoke('get-storage-info')
  },
  readBookFile: (bookPath) => {
    return ipcRenderer.invoke('read-book-file', bookPath)
  },
  downloadCloudBook: (downloadUrl, bookInfo, authToken) => {
    return ipcRenderer.invoke('download-cloud-book', { downloadUrl, bookInfo, authToken })
  },
  selectSavePath: () => {
    return ipcRenderer.invoke('select-save-path')
  },
  clearCache: () => {
    return ipcRenderer.invoke('clear-cache')
  }
})
