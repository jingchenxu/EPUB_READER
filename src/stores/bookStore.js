import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBookStore = defineStore('book', () => {
  const books = ref([])
  const categories = ref([])
  const currentCategory = ref(null) // null 表示所有书籍
  const currentBook = ref(null)
  const currentProgress = ref(null)
  const bookmarks = ref([])

  async function loadBooks(categoryId = null) {
    try {
      const loadedBooks = await window.electronAPI.getBooks(categoryId)
      books.value = loadedBooks
    } catch (error) {
      console.error('Failed to load books:', error)
    }
  }
  
  async function loadCategories() {
    try {
      const loadedCategories = await window.electronAPI.getCategories()
      categories.value = loadedCategories
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }
  
  async function addCategory(name, color = '#667eea') {
    try {
      const result = await window.electronAPI.addCategory(name, color)
      if (result) {
        await loadCategories()
        return result
      }
      return null
    } catch (error) {
      console.error('Failed to add category:', error)
      return null
    }
  }
  
  async function deleteCategory(categoryId) {
    try {
      await window.electronAPI.deleteCategory(categoryId)
      await loadCategories()
      // 如果删除的是当前选中的分类，切换到所有书籍
      if (currentCategory.value === categoryId) {
        currentCategory.value = null
        await loadBooks(null)
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }
  
  async function selectCategory(categoryId) {
    currentCategory.value = categoryId
    await loadBooks(categoryId)
  }

  async function openEpub() {
    try {
      if (!window.electronAPI) {
        console.error('❌ window.electronAPI is not available!')
        alert('Electron API 未加载，请确保在 Electron 环境中运行')
        return null
      }
      
      const result = await window.electronAPI.openEpub()
      
      if (result && result.success) {
        // 重新加载书籍和分类列表
        await loadCategories()
        await loadBooks(currentCategory.value)
        
        // 显示添加结果
        if (result.added.length > 0) {
          let message = `成功添加 ${result.added.length} 本书籍`
          if (result.skipped > 0) {
            message += `，跳过 ${result.skipped} 本已存在的书籍`
          }
          if (result.failed && result.failed.length > 0) {
            message += `，失败 ${result.failed.length} 本`
          }
          alert(message)
        } else if (result.skipped > 0) {
          alert(`所有 ${result.skipped} 本书籍已存在，无需重复添加`)
        } else if (result.failed && result.failed.length > 0) {
          const reasons = result.failed.map(f => `${f.path.split(/[\\/]/).pop()}: ${f.reason}`).join('\n')
          alert(`导入失败 ${result.failed.length} 本书籍：\n${reasons}`)
        } else {
          alert('未导入任何书籍')
        }
        
        return result
      } else {
        // 用户取消了文件选择，不需要提示
        return null
      }
    } catch (error) {
      console.error('❌ Failed to open EPUB:', error)
      console.error('Error details:', error.message, error.stack)
      alert('打开文件失败: ' + error.message)
      return null
    }
  }

  async function deleteBook(bookId) {
    try {
      await window.electronAPI.deleteBook(bookId)
      await loadBooks(currentCategory.value)
    } catch (error) {
      console.error('Failed to delete book:', error)
    }
  }
  
  async function deleteBookCompletely(bookId) {
    try {
      const result = await window.electronAPI.deleteBookCompletely(bookId)
      if (result.success) {
        await loadBooks(currentCategory.value)
      }
      return result
    } catch (error) {
      console.error('Failed to delete book completely:', error)
      return { success: false, error: error.message }
    }
  }
  
  async function updateBookCategory(bookId, categoryId) {
    try {
      await window.electronAPI.updateBookCategory(bookId, categoryId)
      await loadBooks(currentCategory.value)
    } catch (error) {
      console.error('Failed to update book category:', error)
    }
  }
  
  async function exportBook(bookId) {
    try {
      const result = await window.electronAPI.exportBook(bookId)
      return result
    } catch (error) {
      console.error('Failed to export book:', error)
      return { success: false, error: error.message }
    }
  }
  
  async function exportNotes(bookId) {
    try {
      const result = await window.electronAPI.exportNotes(bookId)
      return result
    } catch (error) {
      console.error('Failed to export notes:', error)
      return { success: false, error: error.message }
    }
  }

  function setCurrentBook(book) {
    currentBook.value = book
  }

  async function loadProgress(bookId) {
    try {
      currentProgress.value = await window.electronAPI.getProgress(bookId)
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  async function saveProgress(data) {
    try {
      await window.electronAPI.saveProgress(data)
      currentProgress.value = data
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  async function loadBookmarks(bookId) {
    try {
      bookmarks.value = await window.electronAPI.getBookmarks(bookId)
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
    }
  }

  async function addBookmark(data) {
    try {
      const result = await window.electronAPI.addBookmark(data)
      if (result) {
        await loadBookmarks(data.bookId)
      }
    } catch (error) {
      console.error('Failed to add bookmark:', error)
    }
  }

  async function deleteBookmark(bookmarkId) {
    try {
      await window.electronAPI.deleteBookmark(bookmarkId)
      if (currentBook.value) {
        await loadBookmarks(currentBook.value.id)
      }
    } catch (error) {
      console.error('Failed to delete bookmark:', error)
    }
  }

  return {
    books,
    categories,
    currentCategory,
    currentBook,
    currentProgress,
    bookmarks,
    loadBooks,
    loadCategories,
    addCategory,
    deleteCategory,
    selectCategory,
    openEpub,
    deleteBook,
    deleteBookCompletely,
    updateBookCategory,
    exportBook,
    exportNotes,
    setCurrentBook,
    loadProgress,
    saveProgress,
    loadBookmarks,
    addBookmark,
    deleteBookmark
  }
})
