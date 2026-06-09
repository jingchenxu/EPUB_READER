<template>
  <div class="library-container">
    <div class="library-content">
      <!-- 左侧分类栏 -->
      <div class="sidebar">
        <div class="sidebar-top">
          <div class="logo-section">
            <img src="/logo.svg" alt="EPUB Reader Logo" class="app-logo" />
          </div>
          <button class="btn-add-book" @click="handleOpenEpub">
            添加图书
          </button>
        </div>
        
        <div class="sidebar-section">
          <div class="section-title">书架</div>
          <div class="category-list">
            <div 
              class="category-item" 
              :class="{ active: currentCategory === null }"
              @click="selectCategory(null)"
            >
              <span class="category-dot" :style="{ background: '#999' }"></span>
              <span class="category-name">全部图书</span>
            </div>
            
            <div 
              v-for="category in categories" 
              :key="category.id"
              class="category-item"
              :class="{ active: currentCategory === category.id }"
              @click="selectCategory(category.id)"
              :style="currentCategory === category.id ? { background: (category.color || '#667eea') + '15' } : {}"
            >
              <span class="category-dot" :style="{ background: category.color || '#667eea' }"></span>
              <span class="category-name">{{ category.name }}</span>
            </div>
          </div>
          <div class="category-item add-category-btn" @click="showAddCategoryDialog = true">
            <span class="category-dot">+</span>
            <span class="category-name">新建分类</span>
          </div>
        </div>
        
        <div class="sidebar-section cloud-section">
          <div class="section-title">云端</div>
          <div class="category-item" :class="{ active: showCloudStorage }" @click="openCloudStorage">
            <svg class="cloud-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
            </svg>
            <span class="category-name">云端存储</span>
          </div>
        </div>
        
        <div class="sidebar-footer">
          <div class="user-info" @click="!isLoggedIn ? showLoginDialog = true : null">
            <span v-if="isLoggedIn" class="username">{{ username }}</span>
            <button v-else class="btn-login">用户登录</button>
          </div>
          <button class="btn-settings" @click="showSettings = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            设置
          </button>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="main-content">
        <!-- 设置页面 -->
        <div v-if="showSettings" class="settings-page">
          <div class="settings-header">
            <button class="btn-back" @click="showSettings = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h2>设置</h2>
          </div>

          <!-- 账号 -->
          <div class="settings-section">
            <div class="settings-section-title">账号</div>
            <div class="settings-item">
              <div class="settings-item-label">当前账号</div>
              <div class="settings-item-value">
                <span v-if="isLoggedIn" class="account-name">{{ username }}</span>
                <span v-else class="account-name not-logged">未登录</span>
              </div>
            </div>
            <div class="settings-item" v-if="isLoggedIn">
              <button class="btn-logout" @click="handleLogout">退出登录</button>
            </div>
            <div class="settings-item" v-else>
              <button class="btn-logout" @click="showSettings = false; showLoginDialog = true">去登录</button>
            </div>
          </div>

          <!-- 存储管理 -->
          <div class="settings-section">
            <div class="settings-section-title">存储管理</div>
            <div class="settings-item">
              <div class="settings-item-label">文件保存地址</div>
              <div class="settings-item-value path-value">
                <span class="path-text">{{ storageInfo.savePath || '加载中...' }}</span>
                <button class="btn-change-path" @click="handleChangeSavePath">修改</button>
              </div>
            </div>
            <div class="settings-item">
              <div class="settings-item-label">磁盘剩余空间</div>
              <div class="settings-item-value">{{ formatSize(storageInfo.diskFree) }}</div>
            </div>
            <div class="settings-item">
              <div class="settings-item-label">图书文件占用</div>
              <div class="settings-item-value">{{ formatSize(storageInfo.booksSize) }}</div>
            </div>
          </div>

          <!-- 缓存管理 -->
          <div class="settings-section">
            <div class="settings-section-title">缓存管理</div>
            <div class="settings-item">
              <div class="settings-item-label">缓存空间</div>
              <div class="settings-item-value">{{ formatSize(storageInfo.cacheSize) }}</div>
            </div>
            <div class="settings-item">
              <button class="btn-clear-cache" @click="handleClearCache">清理缓存</button>
            </div>
          </div>

          <!-- 区域与语言 -->
          <div class="settings-section">
            <div class="settings-section-title">区域与语言</div>
            <div class="settings-item">
              <div class="settings-item-label">服务地区</div>
              <div class="settings-item-value">
                <select v-model="settingsForm.region" class="settings-select">
                  <option value="international">国际</option>
                  <option value="china">中国</option>
                </select>
              </div>
            </div>
            <div class="settings-item">
              <div class="settings-item-label">应用语言</div>
              <div class="settings-item-value">
                <select v-model="settingsForm.language" class="settings-select">
                  <option value="en">English</option>
                  <option value="zh">简体中文</option>
                </select>
              </div>
            </div>
            <div class="settings-item">
              <button class="btn-save-settings" @click="handleSaveSettings">确认修改</button>
            </div>
          </div>
        </div>

        <!-- 云端存储页面 -->
        <div v-else-if="showCloudStorage" class="cloud-page">
          <div class="cloud-header">
            <div class="cloud-header-left">
              <button class="btn-back" @click="closeCloudStorage">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h2>云端存储</h2>
              <span class="cloud-space-info">共 {{ formatSize(cloudTotalSpace) }}，已使用 {{ formatSize(cloudUsedSpace) }}</span>
            </div>
          </div>

          <div class="cloud-table-wrapper">
            <table class="cloud-table">
              <thead>
                <tr>
                  <th>书名</th>
                  <th>已下载</th>
                  <th>分类</th>
                  <th>最后阅读</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="book in paginatedCloudBooks" :key="book.id">
                  <td class="cloud-book-title">{{ book.title }}</td>
                  <td>
                    <span :class="book.downloaded ? 'status-yes' : 'status-no'">{{ book.downloaded ? '是' : '否' }}</span>
                  </td>
                  <td>{{ book.category || '未分类' }}</td>
                  <td>{{ book.lastRead || '未阅读' }}</td>
                  <td class="cloud-actions">
                    <button class="btn-cloud-read" @click="handleCloudRead(book)">阅读</button>
                    <button class="btn-cloud-delete" @click="handleCloudDelete(book)">删除</button>
                  </td>
                </tr>
                <tr v-if="cloudBooks.length === 0">
                  <td colspan="5" class="cloud-empty">暂无云端书籍</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="cloud-pagination" v-if="cloudTotalPages > 1">
            <button class="btn-page" :disabled="cloudCurrentPage <= 1" @click="cloudCurrentPage--">上一页</button>
            <span class="page-info">{{ cloudCurrentPage }} / {{ cloudTotalPages }}</span>
            <button class="btn-page" :disabled="cloudCurrentPage >= cloudTotalPages" @click="cloudCurrentPage++">下一页</button>
          </div>
        </div>

        <!-- 书架内容 -->
        <template v-else>
        <!-- 顶部标题栏 -->
        <div class="content-header">
          <div class="header-left">
            <h2 class="category-title">
              {{ currentCategory ? categories.find(c => c.id === currentCategory)?.name || '未分类' : '全部图书' }}
              <span class="book-count">({{ filteredBooks.length }})</span>
            </h2>
          </div>
          <div class="header-right">
            <input 
              type="text" 
              class="search-input" 
              placeholder="输入书名，进行筛选" 
              v-model="searchQuery"
            />
            <div class="sort-dropdown">
              <select v-model="sortBy" class="sort-select">
                <option value="recent">最近</option>
                <option value="title">书名</option>
              </select>
              <svg class="sort-arrow" width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/>
              </svg>
            </div>
          </div>
        </div>
            
        <!-- 书籍网格 -->
        <div class="books-grid">
          <!-- 空状态 -->
          <div v-if="filteredBooks.length === 0" class="empty-state">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <rect x="25" y="20" width="70" height="90" rx="4" stroke="#ddd" stroke-width="3" fill="#f9f9f9"/>
              <line x1="35" y1="40" x2="85" y2="40" stroke="#ddd" stroke-width="2"/>
              <line x1="35" y1="55" x2="85" y2="55" stroke="#ddd" stroke-width="2"/>
              <line x1="35" y1="70" x2="70" y2="70" stroke="#ddd" stroke-width="2"/>
              <circle cx="60" cy="95" r="8" stroke="#ddd" stroke-width="2" fill="none"/>
              <line x1="60" y1="87" x2="60" y2="103" stroke="#ddd" stroke-width="2"/>
              <line x1="52" y1="95" x2="68" y2="95" stroke="#ddd" stroke-width="2"/>
            </svg>
            <p class="empty-text">暂无书籍</p>
            <p class="empty-hint">点击左上角“添加图书”按钮开始阅读</p>
          </div>
          
          <!-- 书籍列表 -->
          <div 
            v-for="book in filteredBooks" 
            :key="book.id" 
            class="book-card"
            @click="handleReadBook(book)"
            @contextmenu.prevent="showBookMenu($event, book)"
          >
            <div class="book-cover-wrapper">
              <div class="book-cover">
                <img 
                  v-if="book.cover_path && appPathLoaded" 
                  :src="getCoverUrlSync(book)" 
                  :alt="book.title"
                  @error="handleImageError"
                />
                <div v-else class="cover-placeholder">
                  {{ book.title.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="book-badge" v-if="book.added_at">{{ getAddedTime(book.added_at) }}</div>
            </div>
            <div class="book-title" :title="book.title">{{ book.title }}</div>
          </div>
        </div>
        </template>
      </div>
    </div>

    <!-- 添加分类对话框 -->
    <div v-if="showAddCategoryDialog" class="modal-overlay" @click.self="showAddCategoryDialog = false">
      <div class="modal">
        <h3>添加分类</h3>
        <input 
          v-model="newCategoryName" 
          type="text" 
          placeholder="输入分类名称"
          @keyup.enter="handleAddCategory"
        />
        
        <!-- 颜色选择器 -->
        <div class="color-picker-section">
          <label class="color-label">选择颜色：</label>
          <div class="color-options">
            <div 
              v-for="color in presetColors" 
              :key="color"
              class="color-option"
              :class="{ selected: selectedColor === color }"
              :style="{ backgroundColor: color }"
              @click="selectedColor = color"
            >
              <svg v-if="selectedColor === color" width="16" height="16" viewBox="0 0 16 16">
                <path d="M3 8l3 3 7-7" stroke="white" stroke-width="2" fill="none"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showAddCategoryDialog = false">取消</button>
          <button class="btn-primary" @click="handleAddCategory">确定</button>
        </div>
      </div>
    </div>

    <!-- 书籍右键菜单 -->
    <div 
      v-if="showBookContextMenu" 
      class="context-menu"
      :style="{ top: contextMenuPosition.y + 'px', left: contextMenuPosition.x + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="handleOpenBookFromMenu">
        <span>📖</span> 打开
      </div>
      <div class="context-menu-item" @click="showCategorySelectDialog = true">
        <span>📁</span> 添加至分类
      </div>
      <div class="context-menu-item" @click="handleExportBook">
        <span>📤</span> 导出文件
      </div>
      <div class="context-menu-item" @click="handleExportNotes">
        <span>📝</span> 导出笔记
      </div>
      <div class="context-menu-item danger" @click="handleDeleteCompletely">
        <span>🗑️</span> 彻底删除
      </div>
    </div>

    <!-- 分类选择对话框 -->
    <div v-if="showCategorySelectDialog" class="modal-overlay" @click.self="showCategorySelectDialog = false">
      <div class="modal">
        <h3>选择分类</h3>
        <div class="category-select-list">
          <div 
            class="category-select-item"
            @click="handleAssignToCategory(null)"
          >
            不分类
          </div>
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="category-select-item"
            @click="handleAssignToCategory(category.id)"
          >
            <span class="category-color" :style="{ backgroundColor: category.color || '#667eea' }"></span>
            {{ category.name }}
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCategorySelectDialog = false">取消</button>
        </div>
      </div>
    </div>

    <!-- 登录对话框 -->
    <div v-if="showLoginDialog" class="modal-overlay" @click.self="showLoginDialog = false">
      <div class="modal login-modal">
        <h3>用户登录</h3>
        <div class="login-form">
          <div class="form-group">
            <label>用户名</label>
            <input 
              type="text" 
              v-model="loginForm.username" 
              placeholder="请输入用户名"
              @keyup.enter="handleLogin"
            />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input 
              type="password" 
              v-model="loginForm.password" 
              placeholder="请输入密码"
              @keyup.enter="handleLogin"
            />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showLoginDialog = false">取消</button>
          <button class="btn-primary" @click="handleLogin">登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useBookStore } from '../stores/bookStore'
import { buildFileUrl } from '../utils/pathHelper'

const bookStore = useBookStore()
const books = computed(() => bookStore.books)
const categories = computed(() => bookStore.categories)
const currentCategory = computed(() => bookStore.currentCategory)
const appPath = ref('')
const userDataPath = ref('')
const appPathLoaded = ref(false)

// 搜索和排序
const searchQuery = ref('')
const sortBy = ref('recent') // 'recent' 或 'title'

// 过滤和排序后的书籍列表
const filteredBooks = computed(() => {
  let result = [...books.value]
  
  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    result = result.filter(book => 
      book.title.toLowerCase().includes(query) ||
      (book.author && book.author.toLowerCase().includes(query))
    )
  }
  
  // 排序
  if (sortBy.value === 'recent') {
    // 按最近添加时间排序
    result.sort((a, b) => {
      const dateA = new Date(a.added_at || 0)
      const dateB = new Date(b.added_at || 0)
      return dateB - dateA
    })
  } else if (sortBy.value === 'title') {
    // 按书名排序
    result.sort((a, b) => {
      return a.title.localeCompare(b.title, 'zh-CN')
    })
  }
  
  return result
})

// 右键菜单状态
const showBookContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const selectedBook = ref(null)

// 对话框状态
const showAddCategoryDialog = ref(false)
const showCategorySelectDialog = ref(false)
const showLoginDialog = ref(false)
const newCategoryName = ref('')
const selectedColor = ref('#667eea') // 默认颜色

// 登录状态
const isLoggedIn = ref(false)
const username = ref('')
const loginForm = ref({
  username: '',
  password: ''
})
const authToken = ref('')

// 设置相关状态
const showSettings = ref(false)
const showCloudStorage = ref(false)
const storageInfo = ref({
  savePath: '',
  booksSize: 0,
  diskFree: 0,
  cacheSize: 0
})
const settingsForm = ref({
  region: localStorage.getItem('app_region') || 'china',
  language: localStorage.getItem('app_language') || 'zh'
})

// 预设颜色列表
const presetColors = [
  '#667eea', // 蓝紫色
  '#764ba2', // 紫色
  '#f093fb', // 粉色
  '#f5576c', // 红色
  '#ff6b6b', // 珊瑚红
  '#ffa94d', // 橙色
  '#ffd43b', // 黄色
  '#69db7c', // 绿色
  '#38d9a9', // 青绿色
  '#4dabf7', // 蓝色
  '#748ffc', // 淡蓝色
  '#9775fa', // 淡紫色
]

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
})

const emit = defineEmits(['read-book'])

// 计算总书籍数量（所有分类）
const totalBooksCount = computed(() => {
  return books.value.length
})

// 获取分类下的书籍数量
function getCategoryBookCount(categoryId) {
  // 这里简化处理，实际应该从后端获取
  return 0
}

// 获取书籍添加时间显示
function getAddedTime(addedAt) {
  if (!addedAt) return ''
  
  const now = new Date()
  const added = new Date(addedAt)
  const diffDays = Math.floor((now - added) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '新添加'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  return `${diffDays}天前`
}

async function handleOpenEpub() {
  await bookStore.openEpub()
}

function handleReadBook(book) {
  if (!book || !book.id) {
    console.error('Invalid book object:', book)
    alert('错误：书籍信息不完整')
    return
  }
  // 将 Proxy 对象转换为普通对象，以便通过 IPC 传递
  const plainBook = {
    id: book.id,
    title: book.title,
    author: book.author,
    book_path: book.book_path,
    cover_path: book.cover_path
  }
  // 调用 Electron API 打开新窗口
  window.electronAPI.openReaderWindow(plainBook)
}

async function handleDeleteBook(bookId) {
  if (confirm('确定要删除这本书吗？')) {
    await bookStore.deleteBook(bookId)
  }
}

// 选择分类
async function selectCategory(categoryId) {
  showSettings.value = false
  showCloudStorage.value = false
  await bookStore.selectCategory(categoryId)
}

// 显示书籍右键菜单
function showBookMenu(event, book) {
  event.preventDefault()
  selectedBook.value = book
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  showBookContextMenu.value = true
}

// 关闭右键菜单
function closeContextMenu() {
  showBookContextMenu.value = false
  selectedBook.value = null
}

// 从右键菜单打开书籍
function handleOpenBookFromMenu() {
  if (selectedBook.value) {
    handleReadBook(selectedBook.value)
  }
  closeContextMenu()
}

// 导出书籍
async function handleExportBook() {
  if (!selectedBook.value) return
  
  const result = await bookStore.exportBook(selectedBook.value.id)
  if (result.success) {
    alert(`书籍已导出到：${result.path}`)
  } else if (result.error !== 'Cancelled') {
    alert('导出失败：' + result.error)
  }
  closeContextMenu()
}

// 导出笔记
async function handleExportNotes() {
  if (!selectedBook.value) return
  
  const result = await bookStore.exportNotes(selectedBook.value.id)
  if (result.success) {
    alert(`笔记已导出到：${result.path}`)
  } else if (result.error !== 'Cancelled') {
    alert('导出失败：' + result.error)
  }
  closeContextMenu()
}

// 彻底删除
async function handleDeleteCompletely() {
  if (!selectedBook.value) return
  
  if (confirm('确定要彻底删除这本书吗？这将删除书籍文件和所有相关数据，此操作不可恢复！')) {
    const result = await bookStore.deleteBookCompletely(selectedBook.value.id)
    if (result.success) {
      alert('书籍已彻底删除')
    } else {
      alert('删除失败：' + result.error)
    }
  }
  closeContextMenu()
}

// 添加分类
async function handleAddCategory() {
  if (!newCategoryName.value.trim()) {
    alert('请输入分类名称')
    return
  }
  
  const result = await bookStore.addCategory(newCategoryName.value.trim(), selectedColor.value)
  if (result) {
    newCategoryName.value = ''
    selectedColor.value = '#667eea' // 重置为默认颜色
    showAddCategoryDialog.value = false
  } else {
    alert('添加分类失败，可能该分类已存在')
  }
}

// 分配书籍到分类
async function handleAssignToCategory(categoryId) {
  if (!selectedBook.value) return
  
  await bookStore.updateBookCategory(selectedBook.value.id, categoryId)
  showCategorySelectDialog.value = false
  closeContextMenu()
  
  if (categoryId === null) {
    alert('已移除分类')
  } else {
    const category = categories.value.find(c => c.id === categoryId)
    if (category) {
      alert(`已添加到分类：${category.name}`)
    }
  }
}

// 登录功能
async function handleLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    alert('请输入用户名和密码')
    return
  }
  
  try {
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: loginForm.value.username,
        password: loginForm.value.password
      })
    })
    
    const data = await response.json()
    
    if (data.token) {
      // 登录成功，保存 token 和用户名
      authToken.value = data.token
      username.value = loginForm.value.username
      isLoggedIn.value = true
      
      // 将 token 缓存到 localStorage
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('username', loginForm.value.username)
      
      alert('登录成功！')
      showLoginDialog.value = false
      
      // 清空表单
      loginForm.value = {
        username: '',
        password: ''
      }
    } else {
      alert('登录失败：' + (data.message || '未知错误'))
    }
  } catch (error) {
    console.error('Login error:', error)
    alert('登录失败：' + error.message)
  }
}

// 退出登录
function handleLogout() {
  isLoggedIn.value = false
  username.value = ''
  authToken.value = ''
  localStorage.removeItem('auth_token')
  localStorage.removeItem('username')
  alert('已退出登录')
}

// 云端存储相关状态
const cloudTotalSpace = 2 * 1024 * 1024 * 1024 // 2GB
const cloudUsedSpace = computed(() => {
  return cloudBooks.value.reduce((sum, b) => sum + (b.size || 0), 0)
})
const cloudCurrentPage = ref(1)
const cloudPageSize = 10
const cloudBooks = ref([
  { id: 1, title: '第一性原理：21堂科学通识课', downloaded: true, category: '科学', lastRead: '2026-05-30', size: 3500000 },
  { id: 2, title: '极简资治通鉴', downloaded: true, category: '历史', lastRead: '2026-05-28', size: 5200000 },
  { id: 3, title: '一本书看透股权架构', downloaded: false, category: '经管', lastRead: '2026-05-25', size: 2800000 },
  { id: 4, title: '逻辑学入门：清晰思考、理性生活的88个逻辑学常识', downloaded: false, category: '哲学', lastRead: '未阅读', size: 4100000 },
  { id: 5, title: '大师讲透王阳明（套装共12册）', downloaded: true, category: '哲学', lastRead: '2026-05-20', size: 8900000 },
  { id: 6, title: '高效论证：美国大学最实用的逻辑训练课', downloaded: false, category: '哲学', lastRead: '2026-05-18', size: 3200000 },
])
const cloudTotalPages = computed(() => Math.ceil(cloudBooks.value.length / cloudPageSize))
const paginatedCloudBooks = computed(() => {
  const start = (cloudCurrentPage.value - 1) * cloudPageSize
  return cloudBooks.value.slice(start, start + cloudPageSize)
})

function openCloudStorage() {
  showCloudStorage.value = true
  showSettings.value = false
  cloudCurrentPage.value = 1
}

function closeCloudStorage() {
  showCloudStorage.value = false
}

function handleCloudRead(book) {
  if (book.downloaded) {
    const localBook = filteredBooks.value.find(b => b.title.includes(book.title.substring(0, 6)))
    if (localBook) {
      handleReadBook(localBook)
    } else {
      alert('本地未找到该书籍，请先下载')
    }
  } else {
    alert('该书籍未下载到本地，请先下载后阅读')
  }
}

function handleCloudDelete(book) {
  if (!confirm(`确认从云端删除「${book.title}」？`)) return
  const idx = cloudBooks.value.findIndex(b => b.id === book.id)
  if (idx !== -1) {
    cloudBooks.value.splice(idx, 1)
  }
}

// 设置相关函数
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}

async function loadStorageInfo() {
  try {
    const info = await window.electronAPI.getStorageInfo()
    storageInfo.value = info
  } catch (error) {
    console.error('Failed to load storage info:', error)
  }
}

async function handleChangeSavePath() {
  try {
    const result = await window.electronAPI.selectSavePath()
    if (result.success) {
      alert('文件保存路径已选择：' + result.path + '\n注意：修改保存路径需要重启应用后生效')
    }
  } catch (error) {
    console.error('Failed to select save path:', error)
  }
}

async function handleClearCache() {
  if (!confirm('确认清理缓存？')) return
  try {
    const result = await window.electronAPI.clearCache()
    if (result.success) {
      alert('缓存清理完成，已释放 ' + formatSize(result.clearedSize))
      await loadStorageInfo()
    } else {
      alert('缓存清理失败：' + result.error)
    }
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

function handleSaveSettings() {
  localStorage.setItem('app_region', settingsForm.value.region)
  localStorage.setItem('app_language', settingsForm.value.language)
  alert('设置已保存')
}

// 监听设置页面打开时加载存储信息
watch(showSettings, (val) => {
  if (val) {
    loadStorageInfo()
    showCloudStorage.value = false
  }
})

// 组件挂载时检查是否有缓存的 token
onMounted(async () => {
  // 检查本地缓存的 token
  const cachedToken = localStorage.getItem('auth_token')
  const cachedUsername = localStorage.getItem('username')
  
  if (cachedToken && cachedUsername) {
    authToken.value = cachedToken
    username.value = cachedUsername
    isLoggedIn.value = true
  }
  
  try {
    appPath.value = await window.electronAPI.getAppPath()
    userDataPath.value = await window.electronAPI.getUserDataPath()
    appPathLoaded.value = true
    
    // 加载分类和书籍
    await bookStore.loadCategories()
    await bookStore.loadBooks(null)
  } catch (error) {
    console.error('Failed to get paths:', error)
  }
  
  // 点击其他地方关闭右键菜单
  document.addEventListener('click', closeContextMenu)
})

function getCoverUrlSync(book) {
  if (!book || !book.cover_path) {
    return ''
  }
  
  if (!appPathLoaded.value) {
    return ''
  }
  
  // 使用路径工具函数构建封面 URL
  return buildFileUrl(book.cover_path, userDataPath.value, appPath.value)
}

function handleImageError(event) {
  console.error('Failed to load cover image:', event.target.src)
  console.error('Image element:', event.target)
  console.error('Parent element:', event.target.parentElement)
  
  // 图片加载失败时显示占位符
  event.target.style.display = 'none'
  const placeholder = event.target.parentElement.querySelector('.cover-placeholder')
  if (placeholder) {
    placeholder.style.display = 'flex'
    console.log('Showing placeholder')
  } else {
    console.error('Placeholder not found')
  }
}
</script>

<style scoped>
.library-container {
  height: 100vh;
  display: flex;
  background: white;
}

/* 左侧栏 */
.sidebar {
  width: 220px;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.sidebar-top {
  padding: 30px 20px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.logo-section {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.app-logo {
  width: 64px;
  height: 64px;
}

.btn-add-book {
  width: 100%;
  padding: 10px 16px;
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-add-book:hover {
  background: #667eea;
  color: white;
}

.sidebar-section {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.section-title {
  padding: 0 20px;
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.category-list {
  margin-bottom: 10px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 10px;
}

.category-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.category-item.active {
  background: rgba(102, 126, 234, 0.15);
}

.category-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.category-item.add-category-btn .category-dot {
  background: transparent;
  color: #999;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8px;
  height: 8px;
}

.category-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: opacity 0.2s;
}

.user-info:hover {
  opacity: 0.7;
}

.btn-login {
  width: 100%;
  padding: 10px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s;
}

.btn-login:hover {
  transform: scale(1.05);
}

.username {
  font-weight: 500;
  color: #333;
}

/* 右侧主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  padding: 30px 40px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
}

.header-left {
  flex: 1;
}

.category-title {
  margin: 0;
  font-size: 24px;
  color: #333;
  font-weight: 600;
}

.book-count {
  font-size: 18px;
  color: #999;
  font-weight: normal;
  margin-left: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-input {
  padding: 8px 16px;
  width: 300px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #667eea;
}

.btn-sort {
  padding: 8px 16px;
  background: white;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.btn-sort:hover {
  border-color: #667eea;
  color: #667eea;
}

.sort-dropdown {
  position: relative;
  display: flex;
  align-items: center;
}

.sort-select {
  padding: 8px 32px 8px 16px;
  background: white;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  transition: all 0.2s;
}

.sort-select:hover {
  border-color: #667eea;
  color: #667eea;
}

.sort-select:focus {
  border-color: #667eea;
}

.sort-arrow {
  position: absolute;
  right: 12px;
  pointer-events: none;
  color: #666;
  transition: color 0.2s;
}

.sort-select:hover + .sort-arrow,
.sort-select:focus + .sort-arrow {
  color: #667eea;
}

/* 书籍网格 */
.books-grid {
  flex: 1;
  padding: 30px 0 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, 150px);
  gap: 20px 30px;
  overflow-y: auto;
  align-content: start;
  justify-content: center;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state svg {
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-text {
  font-size: 18px;
  color: #666;
  margin: 0 0 8px;
  font-weight: 500;
}

.empty-hint {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.book-card {
  width: 150px;
  padding: 0;
  cursor: pointer;
}

.book-cover-wrapper {
  position: relative;
}

.book-cover {
  width: 100%;
  aspect-ratio: 5/7;
  border-radius: 4px;
  overflow: hidden;
  background: #f5f5f5;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
  font-weight: bold;
  background: none;
}

.book-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 107, 53, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.book-title {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
  margin: 2px 0 0 0;
}

.btn-primary {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.btn-secondary {
  padding: 8px 16px;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-icon {
  width: 28px;
  height: 28px;
  border: none;
  background: #667eea;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #5568d3;
}

/* 主内容区域 */
.library-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧分类栏 */
.sidebar {
  width: 250px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.category-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 10px;
}

.category-item:hover {
  background: #f5f5f5;
}

.category-item.active {
  background: #eef0ff;
  border-left: 3px solid #667eea;
}

.category-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.category-name {
  flex: 1;
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-count {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 180px;
  z-index: 1000;
}

.context-menu-item {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #333;
  transition: background 0.2s;
}

.context-menu-item:hover {
  background: #f5f5f5;
}

.context-menu-item.danger {
  color: #ff4444;
}

.context-menu-item.danger:hover {
  background: #ffe5e5;
}

/* 对话框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  margin: 0 0 20px;
  font-size: 18px;
  color: #333;
}

.modal input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 20px;
}

.modal input:focus {
  outline: none;
  border-color: #667eea;
}

/* 登录对话框样式 */
.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 0;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.color-picker-section {
  margin-bottom: 20px;
}

.color-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.color-options {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: 2px solid transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.color-option.selected {
  border-color: #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.category-select-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.category-select-item {
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  transition: background 0.2s;
}

.category-select-item:hover {
  background: #f5f5f5;
}

/* 设置按钮 */
.btn-settings {
  width: 100%;
  padding: 10px 16px;
  background: none;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-settings:hover {
  border-color: #667eea;
  color: #667eea;
}

/* 设置页面 */
.settings-page {
  padding: 30px 40px;
  overflow-y: auto;
  height: 100%;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
}

.settings-header h2 {
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.btn-back {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.btn-back:hover {
  color: #667eea;
}

.settings-section {
  margin-bottom: 28px;
}

.settings-section-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}

.settings-item-label {
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
}

.settings-item-value {
  font-size: 14px;
  color: #333;
  text-align: right;
}

.path-value {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 60%;
}

.path-text {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 250px;
}

.account-name {
  font-size: 14px;
  color: #333;
}

.account-name.not-logged {
  color: #999;
}

.btn-logout,
.btn-change-path,
.btn-clear-cache,
.btn-save-settings {
  padding: 6px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-logout:hover,
.btn-change-path:hover,
.btn-clear-cache:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.btn-save-settings {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.btn-save-settings:hover {
  background: #5a6fd6;
}

.settings-select {
  padding: 6px 28px 6px 12px;
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23999' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: border-color 0.2s;
}

.settings-select:hover {
  border-color: #667eea;
}

.settings-select:focus {
  border-color: #667eea;
}

/* 云端存储页面 */
.cloud-page {
  padding: 30px 40px;
  overflow-y: auto;
  height: 100%;
}

.cloud-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.cloud-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cloud-header-left h2 {
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.cloud-space-info {
  font-size: 13px;
  color: #999;
  margin-left: 8px;
}

.cloud-table-wrapper {
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.cloud-table {
  width: 100%;
  border-collapse: collapse;
}

.cloud-table thead {
  background: #fafafa;
}

.cloud-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: #999;
  border-bottom: 1px solid #f0f0f0;
}

.cloud-table td {
  padding: 12px 16px;
  font-size: 13px;
  color: #333;
  border-bottom: 1px solid #f5f5f5;
}

.cloud-table tbody tr:hover {
  background: #fafafa;
}

.cloud-book-title {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-yes {
  color: #27ae60;
  font-weight: 500;
}

.status-no {
  color: #ccc;
}

.cloud-actions {
  display: flex;
  gap: 8px;
}

.btn-cloud-read,
.btn-cloud-delete {
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-cloud-read {
  color: #667eea;
  border-color: #667eea;
}

.btn-cloud-read:hover {
  background: #667eea;
  color: white;
}

.btn-cloud-delete {
  color: #e74c3c;
  border-color: #e74c3c;
}

.btn-cloud-delete:hover {
  background: #e74c3c;
  color: white;
}

.cloud-empty {
  text-align: center;
  padding: 40px !important;
  color: #999;
  font-size: 14px;
}

.cloud-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding-bottom: 20px;
}

.btn-page {
  padding: 6px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #666;
}

/* 侧边栏云端入口 */
.cloud-section {
  flex: 0 0 auto;
  overflow-y: visible;
  border-top: 1px solid #e8e8e8;
  padding: 12px 0 4px;
}

.cloud-icon {
  flex-shrink: 0;
  color: #999;
}
</style>
