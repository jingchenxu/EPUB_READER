<template>
  <div id="app">
    <Library v-if="!isReading" @read-book="startReading" />
    <Reader v-else :book="currentBook" @close="stopReading" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBookStore } from './stores/bookStore'
import Library from './components/Library.vue'
import Reader from './components/Reader.vue'

const bookStore = useBookStore()
const isReading = ref(false)
const currentBook = ref(null)

onMounted(async () => {
  if (!window.electronAPI) {
    console.error('ERROR: window.electronAPI is not defined!')
    alert('错误：Electron API 未加载！\n请确保通过 npm run electron:dev 启动应用，而不是直接在浏览器中打开。')
  }
  
  // 先加载书籍数据
  await bookStore.loadBooks()
  
  // 检查 URL 参数，如果有书籍信息则自动打开阅读器
  const urlParams = new URLSearchParams(window.location.search)
  const bookId = urlParams.get('bookId')
  const bookTitle = urlParams.get('bookTitle')
  const bookPath = urlParams.get('bookPath')
  
  if (bookId && bookTitle && bookPath) {
    const book = {
      id: parseInt(bookId),
      title: decodeURIComponent(bookTitle),
      book_path: decodeURIComponent(bookPath)
    }
    startReading(book)
  }
})

function startReading(book) {
  if (!book) {
    console.error('No book provided to startReading')
    alert('错误：无法打开书籍，书籍信息为空')
    return
  }
  currentBook.value = book
  isReading.value = true
  
  // 设置窗口标题为书籍名称
  document.title = book.title || 'EPUB Reader'
}

function stopReading() {
  isReading.value = false
  currentBook.value = null
  
  // 恢复默认窗口标题
  document.title = 'EPUB Reader'
}
</script>
