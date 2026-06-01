const { contextBridge, ipcRenderer } = require('electron')

console.log('=== Preload Script Loading ===')
console.log('contextBridge available:', !!contextBridge)
console.log('ipcRenderer available:', !!ipcRenderer)

contextBridge.exposeInMainWorld('electronAPI', {
  openEpub: () => {
    console.log('Preload: openEpub called')
    return ipcRenderer.invoke('open-epub')
  },
  getBooks: (categoryId) => {
    console.log('Preload: getBooks called', categoryId)
    return ipcRenderer.invoke('get-books', categoryId)
  },
  saveProgress: (data) => {
    console.log('Preload: saveProgress called', data)
    return ipcRenderer.invoke('save-progress', data)
  },
  getProgress: (bookId) => {
    console.log('Preload: getProgress called', bookId)
    return ipcRenderer.invoke('get-progress', bookId)
  },
  addBookmark: (data) => {
    console.log('Preload: addBookmark called', data)
    return ipcRenderer.invoke('add-bookmark', data)
  },
  getBookmarks: (bookId) => {
    console.log('Preload: getBookmarks called', bookId)
    return ipcRenderer.invoke('get-bookmarks', bookId)
  },
  deleteBookmark: (bookmarkId) => {
    console.log('Preload: deleteBookmark called', bookmarkId)
    return ipcRenderer.invoke('delete-bookmark', bookmarkId)
  },
  deleteBook: (bookId) => {
    console.log('Preload: deleteBook called', bookId)
    return ipcRenderer.invoke('delete-book', bookId)
  },
  getCategories: () => {
    console.log('Preload: getCategories called')
    return ipcRenderer.invoke('get-categories')
  },
  addCategory: (name, color) => {
    console.log('Preload: addCategory called', name, color)
    return ipcRenderer.invoke('add-category', name, color)
  },
  deleteCategory: (categoryId) => {
    console.log('Preload: deleteCategory called', categoryId)
    return ipcRenderer.invoke('delete-category', categoryId)
  },
  updateBookCategory: (bookId, categoryId) => {
    console.log('Preload: updateBookCategory called', bookId, categoryId)
    return ipcRenderer.invoke('update-book-category', bookId, categoryId)
  },
  exportBook: (bookId) => {
    console.log('Preload: exportBook called', bookId)
    return ipcRenderer.invoke('export-book', bookId)
  },
  exportNotes: (bookId) => {
    console.log('Preload: exportNotes called', bookId)
    return ipcRenderer.invoke('export-notes', bookId)
  },
  deleteBookCompletely: (bookId) => {
    console.log('Preload: deleteBookCompletely called', bookId)
    return ipcRenderer.invoke('delete-book-completely', bookId)
  },
  getAppPath: () => {
    console.log('Preload: getAppPath called')
    return ipcRenderer.invoke('get-app-path')
  },
  getUserDataPath: () => {
    console.log('Preload: getUserDataPath called')
    return ipcRenderer.invoke('get-user-data-path')
  },
  openReaderWindow: (book) => {
    console.log('Preload: openReaderWindow called', book)
    return ipcRenderer.invoke('open-reader-window', book)
  },
  saveAnnotation: (data) => {
    console.log('Preload: saveAnnotation called', data)
    return ipcRenderer.invoke('save-annotation', data)
  },
  getAnnotations: (bookId) => {
    console.log('Preload: getAnnotations called', bookId)
    return ipcRenderer.invoke('get-annotations', bookId)
  },
  deleteAnnotation: (annotationId) => {
    console.log('Preload: deleteAnnotation called', annotationId)
    return ipcRenderer.invoke('delete-annotation', annotationId)
  },
  getStorageInfo: () => {
    return ipcRenderer.invoke('get-storage-info')
  },
  selectSavePath: () => {
    return ipcRenderer.invoke('select-save-path')
  },
  clearCache: () => {
    return ipcRenderer.invoke('clear-cache')
  }
})

console.log('=== electronAPI exposed to window ===')
