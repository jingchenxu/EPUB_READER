<template>
  <div v-if="book" class="reader-container" :class="{ 'dark-mode': isDarkMode }" @mousedown="handleContainerClick">
    <div class="sidebar">
      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'bookmarks' }]"
          @click="activeTab = 'bookmarks'"
        >
          书签
        </button>
        <button 
          :class="['tab', { active: activeTab === 'toc' }]"
          @click="activeTab = 'toc'"
        >
          目录
        </button>
      </div>

      <div class="sidebar-content">
        <div v-if="activeTab === 'bookmarks'">
          <button class="btn-primary" style="width: 100%; margin-bottom: 15px;" @click="showBookmarkModal = true">
            + 添加书签
          </button>
          
          <div v-if="bookmarks.length === 0" class="empty-state">
            <p>暂无书签</p>
          </div>
          
          <div v-else>
            <div v-for="bookmark in bookmarks" :key="bookmark.id" class="bookmark-item">
              <div class="bookmark-title">{{ bookmark.title || '书签' }}</div>
              <div v-if="bookmark.note" class="bookmark-note">{{ bookmark.note }}</div>
              <div class="bookmark-actions">
                <button class="btn-small btn-read" @click="goToBookmark(bookmark)">
                  跳转
                </button>
                <button class="btn-small btn-delete" @click="handleDeleteBookmark(bookmark.id)">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'toc'">
          <div v-if="toc.length === 0" class="empty-state">
            <p>加载中...</p>
          </div>
          <ul v-else style="list-style: none;">
            <li v-for="(chapter, index) in toc" :key="index" style="margin-bottom: 8px;">
              <button 
                class="btn-icon" 
                style="width: 100%; text-align: left;"
                @click="goToChapter(chapter.href)"
              >
                {{ chapter.label }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="reader-main">
      <div class="reader-toolbar">
        <div class="toolbar-left">
          <img src="/logo.svg" alt="Logo" class="toolbar-logo" />
          <button class="btn-icon" @click="prevPage">← 上一页</button>
          <button class="btn-icon" @click="nextPage">下一页 →</button>
        </div>
        
        <div class="progress-info">
          <template v-if="readMode === 'paginated'">
            第 {{ currentPage }} / {{ totalPages }} 页 
          </template>
          ({{ Math.round(currentPercentage) }}%)
        </div>

        <div class="toolbar-right">
                    <div class="mode-dropdown">
            <select v-model="readMode" @change="changeReadMode" class="mode-select">
              <option value="paginated">翻页阅读</option>
              <option value="scrolled">滚动阅读</option>
            </select>
            <svg class="mode-arrow" width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
          <button class="btn-icon" @click="changeFontSize(-1)">A-</button>
          <button class="btn-icon" @click="changeFontSize(1)">A+</button>
          <button class="btn-icon btn-dark-toggle" @click="toggleDarkMode" :title="isDarkMode ? '切换亮色模式' : '切换暗黑模式'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <template v-if="isDarkMode">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </template>
              <template v-else>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </template>
            </svg>
          </button>
          <button class="btn-icon btn-search" @click="toggleSearchPanel" title="全文搜索" ref="searchButtonRef">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <button class="btn-icon btn-settings" @click="toggleSettingsPanel" title="更多设置" ref="settingsButtonRef">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          
          <!-- 设置下拉面板 -->
          <div v-if="showSettingsPanel" class="settings-dropdown" ref="settingsDropdownRef" @click.stop>
            <div class="settings-dropdown-item">
              <label>字体类型</label>
              <select v-model="fontFamily" @change="changeFontFamily(fontFamily)" class="mode-select mode-select-small">
                <option value="">默认字体</option>
                <option value="SimHei, 'Microsoft YaHei', sans-serif">黑体</option>
                <option value="SimSun, 'Songti SC', serif">宋体</option>
                <option value="KaiTi, 'Kaiti SC', cursive">楷体</option>
                <option value="'Microsoft YaHei', 'PingFang SC', sans-serif">圆体</option>
                <option value="STFangsong, 'FangSong', serif">方体</option>
              </select>
            </div>
            <div class="settings-dropdown-divider"></div>
            <div class="settings-dropdown-item">
              <label>文字加粗</label>
              <select v-model="isBold" @change="applyTheme" class="mode-select mode-select-small">
                <option :value="false">关闭</option>
                <option :value="true">开启</option>
              </select>
            </div>
            <div class="settings-dropdown-divider"></div>
            <div class="settings-dropdown-item">
              <label>行间距</label>
              <select v-model="lineHeight" @change="applyTheme" class="mode-select mode-select-small">
                <option :value="1.0">1.0</option>
                <option :value="1.2">1.2</option>
                <option :value="1.5">1.5</option>
                <option :value="1.75">1.75</option>
                <option :value="2.0">2.0</option>
              </select>
            </div>
            <div class="settings-dropdown-divider"></div>
            <div class="settings-dropdown-item">
              <label>阅读区域最大宽度（滚动模式）</label>
              <select v-model="maxReaderWidth" @change="changeMaxReaderWidth(maxReaderWidth)" class="mode-select mode-select-small">
                <option :value="800">800px</option>
                <option :value="1000">1000px</option>
                <option :value="1200">1200px</option>
                <option :value="1400">1400px</option>
              </select>
            </div>
            <div class="settings-dropdown-divider"></div>
            <div class="settings-dropdown-item">
              <label>文字划选菜单</label>
              <select v-model="textSelectionMenu" class="mode-select mode-select-small">
                <option value="auto">自动弹出</option>
                <option value="right">鼠标右键弹出</option>
                <option value="disabled">彻底禁止弹出</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div id="viewer"></div>

      <!-- 阅读进度拖动条 -->
      <div 
        class="reader-progress-bar" 
        ref="progressBarRef"
      >
        <div 
          class="reader-progress-track"
          @mousedown="handleProgressMouseDown"
          @click="handleProgressClick"
        >
          <div class="reader-progress-fill" :style="{ width: currentPercentage + '%' }"></div>
          <div 
            class="reader-progress-thumb" 
            :style="{ left: currentPercentage + '%' }"
            @mousedown.stop="handleThumbMouseDown"
          ></div>
        </div>
        <span class="reader-progress-label">{{ Math.round(currentPercentage) }}%</span>
      </div>
      
      <!-- 加载提示 -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载书籍...</div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div 
      v-if="showContextMenu" 
      class="context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      @click.stop
    >
      <button class="context-menu-item" @click="handleExtract">
        📝 摘抄
      </button>
      <button class="context-menu-item" @click="handleAnnotate">
        💬 批注
      </button>
    </div>

    <!-- 批注输入框 -->
    <div v-if="showAnnotationBox" class="annotation-box">
      <div class="annotation-header">
        <h3>添加批注</h3>
        <button class="btn-close" @click="closeAnnotationBox">×</button>
      </div>
      <div class="annotation-content">
        <div class="selected-text-preview">
          <strong>选中文本：</strong>
          <p>{{ selectedText }}</p>
        </div>
        <textarea 
          v-model="annotationText" 
          placeholder="输入批注内容..."
          rows="4"
        ></textarea>
      </div>
      <div class="annotation-actions">
        <button class="btn-secondary" @click="closeAnnotationBox">取消</button>
        <button class="btn-primary" @click="saveAnnotation">保存批注</button>
      </div>
    </div>

    <div v-if="showBookmarkModal" class="modal-overlay" @click.self="showBookmarkModal = false">
      <div class="modal">
        <h3>添加书签</h3>
        <div class="form-group">
          <label>标题</label>
          <input v-model="bookmarkForm.title" placeholder="书签标题" />
        </div>
        <div class="form-group">
          <label>备注</label>
          <textarea v-model="bookmarkForm.note" placeholder="添加备注..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showBookmarkModal = false">取消</button>
          <button class="btn-primary" @click="handleAddBookmark">保存</button>
        </div>
      </div>
    </div>

    <!-- 搜索抽屉 -->
    <div :class="['search-drawer', { 'open': showSearchPanel }]" ref="searchDropdownRef">
      <div class="search-drawer-header">
        <h3>全文搜索</h3>
        <button class="btn-icon btn-close-search" @click="showSearchPanel = false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="search-drawer-content">
        <div class="search-input-wrapper">
          <input 
            v-model="searchQuery" 
            @input="handleSearchInput"
            @keyup.enter="searchNext"
            placeholder="输入关键词搜索..."
            class="search-input"
          />
        </div>
        <div class="search-navigation">
          <button class="btn-search-nav" @click="searchPrev" title="上一个">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
            上一个
          </button>
          <button class="btn-search-nav" @click="searchNext" title="下一个">
            下一个
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
        </div>
        <div v-if="isSearching" class="search-status">
          搜索中...
        </div>
        <div v-else-if="searchResults.length > 0" class="search-results-info">
          找到 {{ searchResults.length }} 个结果，当前第 {{ currentSearchIndex + 1 }} 个
        </div>
        
        <!-- 搜索结果列表 -->
        <div v-if="searchResults.length > 0" class="search-results-list">
          <div 
            v-for="(result, idx) in searchResults" 
            :key="idx"
            :class="['search-result-item', { active: idx === currentSearchIndex }]"
            @click="goToSearchResult(idx)"
          >
            <div class="search-result-chapter">{{ result.chapter }}</div>
            <div class="search-result-excerpt" v-html="highlightText(result.excerpt, searchQuery)"></div>
          </div>
        </div>
        
        <div v-else-if="searchQuery" class="search-no-results">
          未找到匹配内容
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useBookStore } from '../stores/bookStore'
import ePub from 'epubjs'
import { buildFileUrl } from '../utils/pathHelper'
import { authFetch } from '../utils/httpHelper'

const props = defineProps({
  book: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const bookStore = useBookStore()
const activeTab = ref('toc')  // 默认激活目录tab
const showBookmarkModal = ref(false)
const bookmarkForm = ref({ title: '', note: '' })
const bookmarks = ref([])
const toc = ref([])
const currentPage = ref(0)
const totalPages = ref(0)
const currentPercentage = ref(0)
const fontSize = ref(16)
const fontFamily = ref('')  // 空字符串表示使用默认字体
const isBold = ref(false)  // 文字加粗
const lineHeight = ref(1.5)  // 行间距
const maxReaderWidth = ref(800)  // 阅读区域最大宽度
const textSelectionMenu = ref('right')  // 文字划选菜单: 'auto' | 'right' | 'disabled'
const isDarkMode = ref(false)
const progressBarRef = ref(null)
let isDragging = false
const readMode = ref('scrolled')  // 默认滚动阅读
const isLoading = ref(true)  // 加载状态
let saveProgressTimer = null  // 进度保存防抖定时器
const showSettingsPanel = ref(false)  // 设置面板显示状态
const settingsButtonRef = ref(null)
const settingsDropdownRef = ref(null)

// 搜索相关状态
const showSearchPanel = ref(false)  // 搜索面板显示状态
const searchButtonRef = ref(null)
const searchDropdownRef = ref(null)
const searchQuery = ref('')  // 搜索关键词
const searchResults = ref([])  // 搜索结果列表
const currentSearchIndex = ref(-1)  // 当前选中的搜索结果索引
const isSearching = ref(false)  // 是否正在搜索
let searchDebounceTimer = null  // 搜索防抖定时器

// 选中文本相关状态
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const selectedText = ref('')
const selectedCfi = ref('')
const showAnnotationBox = ref(false)
const annotationText = ref('')
const annotations = ref([])  // 批注列表

let rendition = null
let epubBook = null

onMounted(async () => {
  await initReader()
  await loadBookmarks()
  await loadAnnotations()  // 加载批注
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (rendition) {
    rendition.destroy()
  }
  if (epubBook) {
    epubBook.destroy()
  }
  window.removeEventListener('resize', handleResize)
  // 清理进度保存定时器
  if (saveProgressTimer) {
    clearTimeout(saveProgressTimer)
  }
})

// 监听 maxReaderWidth 变化，自动应用
watch(maxReaderWidth, (newValue) => {
  const viewer = document.getElementById('viewer')
  if (viewer) {
    viewer.style.setProperty('max-width', newValue + 'px', 'important')
  }
})

function handleResize() {
  // 固定列宽模式下，不需要重新调整
  // 如果需要响应式，可以取消下面的注释
  // if (rendition) {
  //   rendition.resize()
  // }
}

async function initReader() {
  try {
    if (!props.book.book_path) {
      throw new Error('Book path is undefined')
    }
    
    // 获取应用路径和用户数据目录
    const appPath = await window.electronAPI.getAppPath()
    const userDataPath = await window.electronAPI.getUserDataPath()
    
    // 使用路径工具函数构建书籍文件 URL
    const filePath = buildFileUrl(props.book.book_path, userDataPath, appPath)
    
    epubBook = ePub(filePath)
    
    // 监听 EPUB 加载事件
    epubBook.loaded.metadata.then((metadata) => {
      // Metadata loaded
    }).catch((error) => {
      console.error('Failed to load EPUB metadata:', error)
    })
    
    // 根据默认阅读模式配置渲染选项
    const renderOptions = {
      width: '100%',
      height: '100%',
      flow: readMode.value,
      spread: 'none',
      minSpreadWidth: 0,
      ignoreClass: ''
    }
    if (readMode.value === 'scrolled') {
      renderOptions.manager = 'continuous'
      renderOptions.overflow = 'auto'
      // 确保滚动模式加载所有内容
      renderOptions.snap = false
    } else {
      // Paginated mode
    }

    rendition = epubBook.renderTo('viewer', renderOptions)

    // 通过 hooks.content 直接向 iframe 注入暗黑模式样式
    // 绕过 epubjs themes API 的不可靠切换问题
    rendition.hooks.content.register((contents) => {
      applyIframeTheme(contents)
    })

    // 先不显示，等待加载 TOC 和恢复进度后再显示

    // 检查 viewer 容器的内容
    setTimeout(() => {
      const viewerElement = document.getElementById('viewer')
      if (viewerElement) {
        // 检查是否有 iframe
        const iframe = viewerElement.querySelector('iframe')
        if (!iframe) {
          // No iframe found
        }
      }
    }, 500)

    // 等待渲染完成后强制重新布局
    // 注意：epubjs 的 rendition.resize() 无参数调用会报错
    // renderTo 时已设置 width/height 100%，页面渲染后会自动布局
    setTimeout(() => {
      if (rendition) {
        try {
          const viewer = document.getElementById('viewer')
          if (viewer) {
            rendition.resize(viewer.clientWidth, viewer.clientHeight)
          }
        } catch (e) {
          // Resize failed
        }
      }
    }, 500)

    rendition.on('rendered', () => {
      const location = rendition.currentLocation()
      if (location) {
        updateProgress(location)
      }
      
      // 每次页面渲染后重新设置右键监听
      setupIframeContextMenu()
    })

    rendition.on('relocated', (location) => {
      updateProgress(location)
      // 使用防抖保存进度，减少数据库写入频率
      debouncedSaveProgress()
    })

    // 监听错误
    rendition.on('error', (error) => {
      console.error('Rendition error:', error)
    })
    
    // 监听 iframe 的右键事件
    setupIframeContextMenu()

    const loadedToc = await epubBook.loaded.navigation
    toc.value = loadedToc.toc

    // 先显示内容，再生成 locations（优化首次加载速度）
    setTimeout(async () => {
      applyTheme()
      
      // 异步加载进度，不阻塞显示
      const progressPromise = bookStore.loadProgress(props.book.id)
      
      // 立即渲染第一页（不等待进度）
      await rendition.display()
      
      // 隐藏加载提示
      isLoading.value = false
      
      // 应用初始最大宽度设置
      const viewer = document.getElementById('viewer')
      if (viewer) {
        viewer.style.setProperty('max-width', maxReaderWidth.value + 'px', 'important')
      }
      
      // 等待进度加载完成后恢复位置
      await progressPromise
      if (bookStore.currentProgress && bookStore.currentProgress.cfi) {
        // Check if saved position is cover/copyright page
        
        // 检查是否是封面或版权页，如果是则跳转到第一章
        const cfi = bookStore.currentProgress.cfi
        if (cfi.includes('titlepage') || cfi.includes('copyright') || cfi.includes('cover')) {
          // Saved position is cover/copyright page, jumping to first chapter instead
          // 继续执行下面的跳转到第一章逻辑
        } else {
          await rendition.display(cfi)
          // 后台生成 locations（不阻塞显示）
          generateLocationsInBackground()
          return  // 直接返回，不执行后面的跳转逻辑
        }
      }
      
      // 如果没有阅读进度，跳转到目录中的第一个章节（跳过封面和版权页）
        if (toc.value && toc.value.length > 0) {
          // 查找第一个非封面/版权的章节
          let firstChapter = null
          let fallbackChapter = null
          
          for (const chapter of toc.value) {
            const label = chapter.label.toLowerCase()
            
            // 跳过封面、版权、扉页等
            if (label.includes('cover') || 
                label.includes('copyright') || 
                label.includes('title') ||
                label.includes('扉页') ||
                label.includes('版权')) {
              continue
            }
            
            // 保存第一个非封面的章节作为备选
            if (!fallbackChapter) {
              fallbackChapter = chapter
            }
            
            // 优先选择包含"章"或"chapter"的章节
            if (label.includes('章') || label.includes('chapter')) {
              firstChapter = chapter
              break
            }
          }
          
          // 如果没找到带"章"的章节，使用备选
          if (!firstChapter && fallbackChapter) {
            firstChapter = fallbackChapter
          }
          
          if (firstChapter) {
            await rendition.display(firstChapter.href)
          } else {
            await rendition.display()  // 从开头显示
          }
        } else {
          await rendition.display()  // 从开头显示
        }
      
      // 后台生成 locations（不阻塞显示）
      generateLocationsInBackground()
    }, 300)  // 减少等待时间到 300ms
  } catch (error) {
    console.error('Failed to initialize reader:', error.message)
    alert('无法打开书籍文件: ' + error.message)
    emit('close')
  }
}

// 后台生成 locations（不阻塞首次显示）
async function generateLocationsInBackground() {
  try {
    const startTime = Date.now()
    await epubBook.locations.generate(160)  // 每 160 个字符一个位置
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    // Locations generated successfully
  } catch (error) {
    console.error('Failed to generate locations:', error)
  }
}

function updateProgress(location) {
  if (location && location.start) {
    currentPage.value = location.start.displayed.page
    totalPages.value = location.start.displayed.total
    
    // 根据阅读模式选择不同的进度计算方式
    if (readMode.value === 'scrolled') {
      // 滚动模式：尝试使用 epub.js 提供的整书百分比
      const rawPercentage = location.start.percentage
      
      if (rawPercentage !== undefined && rawPercentage !== null && rawPercentage > 0) {
        currentPercentage.value = Math.round(rawPercentage * 100)
      } else {
        // 如果 percentage 不可用或为0，尝试其他方法
        // 尝试使用 CFI 来估算进度（需要加载完整的 locations）
        if (epubBook && epubBook.locations) {
          const cfi = location.start.cfi
          const percentage = epubBook.locations.percentageFromCfi(cfi)
          if (percentage !== undefined && percentage !== null) {
            currentPercentage.value = Math.round(percentage * 100)
          } else {
            currentPercentage.value = 0
          }
        } else {
          currentPercentage.value = 0
        }
      }
    } else {
      // 翻页模式：手动计算当前章节的百分比
      const page = location.start.displayed.page
      const total = location.start.displayed.total
      
      if (total > 0) {
        currentPercentage.value = Math.round((page / total) * 100)
      } else {
        currentPercentage.value = 0
      }
    }
  }
}

// === 进度条拖动跳转 ===

/** 从进度条的点击/拖动位置计算百分比（基于 track 实际宽度） */
function getPercentFromEvent(event) {
  const bar = progressBarRef.value
  if (!bar) return 0
  const track = bar.querySelector('.reader-progress-track')
  if (!track) return 0
  const rect = track.getBoundingClientRect()
  const x = event.clientX - rect.left
  return Math.max(0, Math.min(100, (x / rect.width) * 100))
}

/** 根据百分比跳转到书籍对应位置 */
function jumpToPercent(percent) {
  if (!rendition || !epubBook) return

  try {
    // 尝试通过 locations 计算 CFI 并跳转
    const locs = epubBook.locations
    const locCount = locs && (locs._locations ? locs._locations.length : locs.length)

    if (locCount > 0) {
      const cfi = locs.cfiFromPercentage(percent / 100)
      if (cfi) {
        rendition.display(cfi)
        // 滚动模式：display() 会打断 continuous manager 的章节串联，
        // 需要手动触发滚动事件让管理器检测位置并加载相邻章节
        if (readMode.value === 'scrolled') {
          requestAnimationFrame(() => {
            const viewer = document.getElementById('viewer')
            if (viewer) {
              viewer.dispatchEvent(new Event('scroll', { bubbles: true }))
            }
          })
        }
        return
      }
    }

    // 备用方案：通过 spine 估算章节位置
    const spine = epubBook.spine
    if (spine && spine.length > 0) {
      const idx = Math.floor((percent / 100) * (spine.length - 1))
      const target = spine.get(idx)
      if (target) {
        rendition.display(target.href || target.idref)
        return
      }
    }

    // No valid jump target found
  } catch (e) {
    console.error('Failed to jump to percentage:', e)
  }
}

function handleProgressClick(event) {
  if (isDragging) return
  const percent = getPercentFromEvent(event)
  jumpToPercent(percent)
}

function handleProgressMouseDown(event) {
  isDragging = true
  const percent = getPercentFromEvent(event)
  jumpToPercent(percent)

  const onMouseMove = (e) => {
    const pct = getPercentFromEvent(e)
    jumpToPercent(pct)
  }
  const onMouseUp = () => {
    isDragging = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function handleThumbMouseDown(event) {
  // thumb 本身支持拖动，复用相同逻辑
  isDragging = true
  const onMouseMove = (e) => {
    const pct = getPercentFromEvent(e)
    jumpToPercent(pct)
  }
  const onMouseUp = () => {
    isDragging = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

async function saveProgress() {
  const location = rendition.currentLocation()
  if (location && location.start) {
    const progressData = {
      bookId: props.book.id,
      cfi: location.start.cfi,
      page: location.start.displayed.page,
      percentage: location.start.percentage
    }
    
    // 保存到本地数据库
    await bookStore.saveProgress(progressData)
    
    // 同步到云端（静默失败，不影响本地保存）
    syncProgressToCloud(progressData)
  }
}

// 同步阅读进度到云端
async function syncProgressToCloud(progressData) {
  const token = localStorage.getItem('auth_token_full') || localStorage.getItem('auth_token')
  if (!token) return  // 未登录，跳过云端同步
  
  try {
    const response = await authFetch('http://localhost:8080/api/sync/progress', {
      method: 'POST',
      body: JSON.stringify({
        bookId: progressData.bookId,
        cfi: progressData.cfi,
        page: progressData.page,
        percentage: progressData.percentage
      })
    })
    // 不处理响应，静默失败
  } catch (e) {
    // 云端同步失败不影响本地使用，忽略错误
  }
}

// 防抖保存进度（500ms 内只保存一次）
function debouncedSaveProgress() {
  if (saveProgressTimer) {
    clearTimeout(saveProgressTimer)
  }
  saveProgressTimer = setTimeout(() => {
    saveProgress()
    saveProgressTimer = null
  }, 500)
}

async function loadBookmarks() {
  await bookStore.loadBookmarks(props.book.id)
  bookmarks.value = bookStore.bookmarks
}

// 加载批注
async function loadAnnotations() {
  try {
    const loadedAnnotations = await window.electronAPI.getAnnotations(props.book.id)
    annotations.value = loadedAnnotations
    
    // 在文本上标记批注
    highlightAnnotations()
  } catch (error) {
    console.error('Failed to load annotations:', error)
  }
}

// 高亮显示批注
function highlightAnnotations() {
  if (!rendition || !annotations.value.length) return
  
  // 清除之前的高亮
  rendition.annotations.remove()
  
  // 为每个批注添加高亮
  annotations.value.forEach(annotation => {
    try {
      // 添加高亮标记
      rendition.annotations.add(
        'highlight',
        annotation.cfi,
        {},  // 数据
        (event, current) => {
          // 点击高亮时显示批注
          showAnnotationPopup(annotation, event)
        },
        'annotation-highlight',  // CSS class
        {
          fill: annotation.color || '#FFEB3B',
          'fill-opacity': '0.3',
          'mix-blend-mode': 'multiply'
        }
      )
    } catch (e) {
      console.warn('Failed to highlight annotation:', annotation.id, e.message)
    }
  })
}

// 显示批注弹窗
function showAnnotationPopup(annotation, event) {
  // 创建批注提示框
  const popup = document.createElement('div')
  popup.className = 'annotation-popup'
  popup.innerHTML = `
    <div class="popup-header">
      <strong>批注</strong>
      <button class="popup-close">×</button>
    </div>
    <div class="popup-content">
      <div class="popup-text"><strong>原文：</strong>${annotation.selected_text}</div>
      <div class="popup-annotation"><strong>批注：</strong>${annotation.annotation}</div>
    </div>
  `
  
  // 定位弹窗 - 使用 event.target 的位置
  let popupX, popupY
  
  // 尝试从 event.target 获取位置
  if (event.target && event.target.getBoundingClientRect) {
    const rect = event.target.getBoundingClientRect()
    // 使用高亮区域的中心位置
    popupX = rect.left + rect.width / 2
    popupY = rect.bottom + 10  // 在高亮区域下方显示
  } else {
    // 备用方案：使用 clientX/Y
    popupX = event.clientX + 10
    popupY = event.clientY + 10
  }
  
  // 确保弹窗不超出视口边界
  const popupWidth = 300
  const popupHeight = 200
  
  if (popupX + popupWidth > window.innerWidth) {
    popupX = window.innerWidth - popupWidth - 10
  }
  
  if (popupY + popupHeight > window.innerHeight) {
    popupY = window.innerHeight - popupHeight - 10
  }
  
  popup.style.position = 'fixed'
  popup.style.left = popupX + 'px'
  popup.style.top = popupY + 'px'
  popup.style.zIndex = '2000'
  
  document.body.appendChild(popup)
  
  // 关闭按钮事件
  popup.querySelector('.popup-close').addEventListener('click', () => {
    popup.remove()
  })
  
  // 3秒后自动关闭
  setTimeout(() => {
    if (popup.parentNode) {
      popup.remove()
    }
  }, 5000)
}

function goToBookmark(bookmark) {
  rendition.display(bookmark.cfi)
}

function goToChapter(href) {
  rendition.display(href)
}

function prevPage() {
  rendition.prev()
}

function nextPage() {
  rendition.next()
}

function changeFontSize(delta) {
  fontSize.value += delta
  applyTheme()
}

function changeFontFamily(font) {
  fontFamily.value = font
  applyTheme()
}

function toggleBold() {
  isBold.value = !isBold.value
  applyTheme()
}

function changeLineHeight(value) {
  lineHeight.value = parseFloat(value)
  applyTheme()
}

function changeMaxReaderWidth(value) {
  maxReaderWidth.value = parseInt(value)
  // 应用宽度变化
  const viewer = document.getElementById('viewer')
  if (viewer) {
    viewer.style.setProperty('max-width', maxReaderWidth.value + 'px', 'important')
  }
}

function applyTheme() {
  if (rendition) {
    rendition.themes.fontSize(`${fontSize.value}px`)
    
    // 应用字体
    if (fontFamily.value) {
      rendition.themes.font(fontFamily.value)
    } else {
      rendition.themes.font('')
    }
    
    // 应用加粗 - 确保 isBold 是布尔值
    const bold = isBold.value === true || isBold.value === 'true'
    if (bold) {
      rendition.themes.override('font-weight', 'bold', true)
    } else {
      rendition.themes.override('font-weight', 'normal', true)
    }
    
    // 刷新所有 iframe 的主题（会重新应用行间距）
    refreshAllIframesTheme()
  }
}

/**
 * 直接向 epubjs iframe 注入暗黑/亮色主题样式
 * 绕过 rendition.themes API（在已渲染内容上切换不可靠）
 * @param {object} contents - epubjs rendition.getContents() 返回的单个内容对象
 */
function applyIframeTheme(contents) {
  if (!contents || !contents.document) return
  const doc = contents.document
  const head = doc.head
  const body = doc.body
  if (!body) return

  const dark = isDarkMode.value

  // 移除旧的注入样式标签
  const oldStyle = doc.getElementById('rosa-theme-style')
  if (oldStyle) oldStyle.remove()

  // 构建样式内容
  let cssText = ''
  
  // 应用行间距
  cssText += `
    body, p, div, span, li, td, th, blockquote, dd, dt, pre, code, h1, h2, h3, h4, h5, h6 {
      line-height: ${lineHeight.value} !important;
    }
  `
  
  if (dark) {
    // 注入暗黑模式样式（!important 覆盖 EPUB 自带样式）
    cssText += `
      body {
        background: #1e1e32 !important;
        color: #e8e8ec !important;
      }
      p, div, span, li, td, th, blockquote, dd, dt, pre, code {
        color: #e0e0e8 !important;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #f0f0f5 !important;
      }
      a {
        color: #9aafff !important;
      }
      a:visited {
        color: #c0b0ff !important;
      }
      img {
        filter: brightness(0.9);
      }
    `
  }
  
  // 创建并注入样式标签
  const style = doc.createElement('style')
  style.id = 'rosa-theme-style'
  style.textContent = cssText
  head.appendChild(style)
}

/**
 * 遍历 viewer 中所有 iframe，重新应用主题
 */
function refreshAllIframesTheme() {
  const viewer = document.getElementById('viewer')
  if (!viewer || !rendition) return

  const iframes = viewer.querySelectorAll('iframe')
  iframes.forEach(iframe => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (!doc) return
      applyIframeTheme({ document: doc })
    } catch (e) {
      // 跨域 iframe，忽略
    }
  })

  // 也通过 epubjs API 刷新
  try {
    const contents = rendition.getContents()
    if (contents && contents.length) {
      contents.forEach(c => applyIframeTheme(c))
    }
  } catch (e) {
    // getContents failed
  }
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
  refreshAllIframesTheme()
}

function toggleSettingsPanel() {
  showSettingsPanel.value = !showSettingsPanel.value
}

// 切换搜索面板
function toggleSearchPanel() {
  showSearchPanel.value = !showSearchPanel.value
  if (showSearchPanel.value) {
    // 打开搜索面板时聚焦输入框
    setTimeout(() => {
      const searchInput = document.querySelector('.search-input')
      if (searchInput) searchInput.focus()
    }, 100)
  }
}

// 处理搜索输入（防抖）
function handleSearchInput() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  
  searchDebounceTimer = setTimeout(() => {
    if (searchQuery.value.trim()) {
      performSearch()
    } else {
      clearSearch()
    }
  }, 300)
}

// 执行搜索
async function performSearch() {
  if (!epubBook || !searchQuery.value.trim()) return
  
  isSearching.value = true
  searchResults.value = []
  currentSearchIndex.value = -1
  
  try {
    const query = searchQuery.value.trim().toLowerCase()
    const results = []
    
    // 获取所有章节（spine）
    const spine = epubBook.spine
    if (!spine || !spine.items) {
      isSearching.value = false
      return
    }
    
    // 遍历所有章节
    for (let i = 0; i < spine.items.length; i++) {
      const item = spine.items[i]
      
      try {
        // 加载章节内容
        const chapter = await epubBook.load(item.href)
        
        if (chapter && chapter.documentElement) {
          // 提取文本内容
          const text = chapter.documentElement.textContent || ''
          const lowerText = text.toLowerCase()
          
          // 查找所有匹配位置
          let position = 0
          while ((position = lowerText.indexOf(query, position)) !== -1) {
            // 提取上下文（前后各50个字符）
            const start = Math.max(0, position - 50)
            const end = Math.min(text.length, position + query.length + 50)
            const excerpt = text.substring(start, end).trim()
            
            // 生成 CFI（简化版，使用章节索引和位置）
            const cfi = item.cfiBase || `epubcfi(/6/${i + 2}!/${item.href})`
            
            results.push({
              href: item.href,  // 使用章节 href 进行跳转
              excerpt: excerpt,
              chapter: item.label || `第${i + 1}章`,
              index: i,
              position: position  // 记录匹配位置
            })
            
            position += query.length
            
            // 限制每个章节最多返回10个结果
            if (results.filter(r => r.index === i).length >= 10) {
              break
            }
          }
        }
      } catch (error) {
        console.error(`Error loading chapter ${i}:`, error)
      }
    }
    
    if (results.length > 0) {
      searchResults.value = results
      currentSearchIndex.value = 0
      // 跳转到第一个搜索结果
      goToSearchResult(0)
    }
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    isSearching.value = false
  }
}

// 清除搜索
function clearSearch() {
  searchResults.value = []
  currentSearchIndex.value = -1
  
  // 移除高亮
  if (rendition) {
    rendition.annotations.remove(undefined, 'highlight')
  }
}

// 高亮文本中的关键词
function highlightText(text, query) {
  if (!query || !text) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

// 跳转到指定搜索结果
function goToSearchResult(index) {
  if (index < 0 || index >= searchResults.value.length) return
  
  currentSearchIndex.value = index
  const result = searchResults.value[index]
  
  if (rendition && result.href) {
    try {
      // 清除之前的高亮
      rendition.annotations.remove(undefined, 'highlight')
      
      // 跳转到结果所在的章节
      rendition.display(result.href)
        .then(() => {
          // Successfully navigated to chapter
        })
        .catch((error) => {
          console.error('Failed to navigate to chapter:', error)
        })
    } catch (error) {
      console.error('Error in goToSearchResult:', error)
    }
  }
}

// 上一个搜索结果
function searchPrev() {
  if (searchResults.value.length === 0) return
  
  let newIndex = currentSearchIndex.value - 1
  if (newIndex < 0) {
    newIndex = searchResults.value.length - 1  // 循环到最后一个
  }
  goToSearchResult(newIndex)
}

// 下一个搜索结果
function searchNext() {
  if (searchResults.value.length === 0) return
  
  let newIndex = currentSearchIndex.value + 1
  if (newIndex >= searchResults.value.length) {
    newIndex = 0  // 循环到第一个
  }
  goToSearchResult(newIndex)
}

// 点击外部关闭设置面板
function handleClickOutside(event) {
  // 关闭设置面板
  if (showSettingsPanel.value) {
    const isClickOnButton = settingsButtonRef.value && settingsButtonRef.value.contains(event.target)
    const isClickOnDropdown = settingsDropdownRef.value && settingsDropdownRef.value.contains(event.target)
    
    if (!isClickOnButton && !isClickOnDropdown) {
      showSettingsPanel.value = false
    }
  }
  
  // 关闭搜索面板
  if (showSearchPanel.value) {
    const isClickOnButton = searchButtonRef.value && searchButtonRef.value.contains(event.target)
    const isClickOnDropdown = searchDropdownRef.value && searchDropdownRef.value.contains(event.target)
    
    if (!isClickOnButton && !isClickOnDropdown) {
      showSearchPanel.value = false
    }
  }
}

// 容器点击处理（用于关闭设置面板）
function handleContainerClick(event) {
  // 关闭设置面板
  if (showSettingsPanel.value) {
    const isClickOnButton = settingsButtonRef.value && settingsButtonRef.value.contains(event.target)
    const isClickOnDropdown = settingsDropdownRef.value && settingsDropdownRef.value.contains(event.target)
    
    if (!isClickOnButton && !isClickOnDropdown) {
      showSettingsPanel.value = false
    }
  }
  
  // 关闭搜索面板
  if (showSearchPanel.value) {
    const isClickOnButton = searchButtonRef.value && searchButtonRef.value.contains(event.target)
    const isClickOnDropdown = searchDropdownRef.value && searchDropdownRef.value.contains(event.target)
    
    if (!isClickOnButton && !isClickOnDropdown) {
      showSearchPanel.value = false
    }
  }
  
  // 关闭右键菜单
  if (showContextMenu.value) {
    const contextMenu = document.querySelector('.context-menu')
    if (contextMenu && !contextMenu.contains(event.target)) {
      showContextMenu.value = false
    }
  }
}

async function handleAddBookmark() {
  const location = rendition.currentLocation()
  if (location && location.start) {
    await bookStore.addBookmark({
      bookId: props.book.id,
      cfi: location.start.cfi,
      title: bookmarkForm.value.title,
      note: bookmarkForm.value.note
    })
    showBookmarkModal.value = false
    bookmarkForm.value = { title: '', note: '' }
    await loadBookmarks()
  }
}

async function handleDeleteBookmark(bookmarkId) {
  if (confirm('确定要删除这个书签吗？')) {
    await bookStore.deleteBookmark(bookmarkId)
    await loadBookmarks()
  }
}

function changeReadMode() {
  if (!rendition || !epubBook) return
  
  // 保存当前位置
  const location = rendition.currentLocation()
  const currentCfi = location?.start?.cfi
  
  // 销毁当前渲染
  rendition.destroy()
  
  // 重新创建渲染
  setTimeout(async () => {
    try {
      // 根据阅读模式使用不同的配置
      const renderOptions = {
        width: '100%',
        height: '100%',
        flow: readMode.value,
        spread: 'none',
        minSpreadWidth: 0,
        ignoreClass: ''
      }
      
      // 滚动模式的特殊配置
      if (readMode.value === 'scrolled') {
        renderOptions.manager = 'continuous'  // 使用连续管理器
        renderOptions.overflow = 'auto'
        renderOptions.snap = false  // 禁用吸附，允许自由滚动
      } else {
        // Paginated mode
      }
      
      rendition = epubBook.renderTo('viewer', renderOptions)
      
      // 注册内容钩子以应用主题
      rendition.hooks.content.register((contents) => {
        applyIframeTheme(contents)
      })
      
      // 恢复到之前的位置或从开头开始
      if (currentCfi) {
        await rendition.display(currentCfi)
      } else {
        await rendition.display()
      }
      
      // 检查 viewer 容器的状态
      const viewerElement = document.getElementById('viewer')
      if (viewerElement) {
        const iframe = viewerElement.querySelector('iframe')
        if (iframe) {
          // 如果是滚动模式且宽度为0，强制设置宽度
          if (readMode.value === 'scrolled' && iframe.offsetWidth === 0) {
            const container = iframe.parentElement
            if (container) {
              container.style.width = viewerElement.offsetWidth + 'px'
              iframe.style.width = viewerElement.offsetWidth + 'px'
            }
          }
        }
      }
      
      // 重新绑定事件
      rendition.on('rendered', () => {
        const location = rendition.currentLocation()
        if (location) {
          updateProgress(location)
        }
      })
      
      rendition.on('relocated', (location) => {
        updateProgress(location)
        saveProgress()
      })
      
      // 重新设置 iframe 的右键事件监听
      setupIframeContextMenu()
    } catch (error) {
      console.error('Failed to change read mode:', error)
      alert('切换阅读模式失败: ' + error.message)
    }
  }, 200)
}

// 右键菜单处理
function handleContextMenu(event) {
  // 如果设置为彻底禁止弹出，直接返回
  if (textSelectionMenu.value === 'disabled') {
    return
  }
  
  // 获取选中的文本
  const selection = window.getSelection()
  const text = selection.toString().trim()
  
  if (!text) {
    // 没有选中文本，不显示菜单
    return
  }
  
  // 如果是右键模式，检查是否是右键事件
  if (textSelectionMenu.value === 'right' && event.type !== 'contextmenu') {
    return
  }
  
  // 阻止默认右键菜单
  event.preventDefault()
  
  // 保存选中文本和位置
  selectedText.value = text
  
  // 获取选中位置的 CFI
  if (rendition) {
    try {
      const range = selection.getRangeAt(0)
      const cfi = rendition.getCFI(range)
      selectedCfi.value = cfi
    } catch (e) {
      console.warn('Failed to get CFI:', e)
      selectedCfi.value = ''
    }
  }
  
  // 显示菜单在鼠标位置
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  showContextMenu.value = true
}

// 设置 iframe 的右键事件监听
function setupIframeContextMenu() {
  const trySetupListener = (attempt = 0) => {
    const viewerElement = document.getElementById('viewer')
    if (!viewerElement) {
      return false
    }
    
    const iframe = viewerElement.querySelector('iframe')
    if (!iframe) {
      return false
    }
    
    try {
      // 检查 iframe 是否已加载
      if (!iframe.contentDocument) {
        return false
      }
      
      
      // 在 iframe 内部添加点击事件监听器，用于关闭设置面板和右键菜单
      iframe.contentDocument.addEventListener('mousedown', (event) => {
        // 关闭设置面板
        if (showSettingsPanel.value) {
          const isClickOnButton = settingsButtonRef.value && settingsButtonRef.value.contains(event.target)
          const isClickOnDropdown = settingsDropdownRef.value && settingsDropdownRef.value.contains(event.target)
          
          if (!isClickOnButton && !isClickOnDropdown) {
            showSettingsPanel.value = false
          }
        }
        
        // 关闭搜索面板
        if (showSearchPanel.value) {
          const isClickOnButton = searchButtonRef.value && searchButtonRef.value.contains(event.target)
          const isClickOnDropdown = searchDropdownRef.value && searchDropdownRef.value.contains(event.target)
          
          if (!isClickOnButton && !isClickOnDropdown) {
            showSearchPanel.value = false
          }
        }
        
        // 关闭右键菜单
        if (showContextMenu.value) {
          const contextMenu = document.querySelector('.context-menu')
          if (contextMenu && !contextMenu.contains(event.target)) {
            showContextMenu.value = false
          }
        }
      })
      
      // 监听 iframe 内部的右键事件
      iframe.contentDocument.addEventListener('contextmenu', (event) => {
        
        // 从 iframe 内部获取选中的文本
        const iframeSelection = iframe.contentWindow.getSelection()
        const text = iframeSelection.toString().trim()
        
        if (!text) {
          return
        }
        
        // 阻止默认右键菜单
        event.preventDefault()
        
        // 保存选中文本
        selectedText.value = text
        
        // 获取选中位置的 CFI
        if (rendition) {
          try {
            const range = iframeSelection.getRangeAt(0)
            // 使用 rendition 的 getContents 来获取当前章节，然后生成 CFI
            const contents = rendition.getContents()
            if (contents && contents.length > 0) {
              const content = contents[0]
              const cfi = content.cfiFromRange(range)
              selectedCfi.value = cfi
            } else {
              selectedCfi.value = ''
            }
          } catch (e) {
            console.warn('Failed to get CFI:', e.message)
            selectedCfi.value = ''
          }
        }
        
        // 计算菜单位置，确保在可视区域内
        const menuWidth = 120  // 菜单宽度
        const menuHeight = 80  // 菜单高度
        
        // 获取 iframe 的位置偏移
        const iframeRect = iframe.getBoundingClientRect()
        
        // 将 iframe 内部的坐标转换为外层文档的坐标
        let menuX = event.clientX + iframeRect.left
        let menuY = event.clientY + iframeRect.top
        
        // 如果菜单会超出右边界，向左调整
        if (menuX + menuWidth > window.innerWidth) {
          menuX = window.innerWidth - menuWidth - 10
        }
        
        // 如果菜单会超出下边界，向上调整
        if (menuY + menuHeight > window.innerHeight) {
          menuY = window.innerHeight - menuHeight - 10
        }
        
        // 确保不超出左/上边界
        menuX = Math.max(10, menuX)
        menuY = Math.max(10, menuY)
        
        // 显示菜单
        contextMenuPosition.value = {
          x: menuX,
          y: menuY
        }
        showContextMenu.value = true
      })
      return true
    } catch (e) {
      console.error('❌ Cannot access iframe contentDocument:', e.message)
      console.error('Error details:', e)
      return false
    }
  }
  
  // 立即尝试一次
  if (trySetupListener()) {
    return
  }
  
  // 如果失败，每隔 500ms 重试一次，最多重试 10 次
  let attempts = 0
  const maxAttempts = 10
  const retryInterval = setInterval(() => {
    attempts++
    
    if (trySetupListener(attempts)) {
      clearInterval(retryInterval)
    } else if (attempts >= maxAttempts) {
      clearInterval(retryInterval)
    }
  }, 500)
}

// 点击其他地方关闭菜单
function closeContextMenu() {
  showContextMenu.value = false
}

// 摘抄功能
function handleExtract() {
  closeContextMenu()
  // TODO: 实现摘抄保存到数据库
  alert('已摘抄：' + selectedText.value.substring(0, 50) + '...')
}

// 批注功能
function handleAnnotate() {
  closeContextMenu()
  
  // 清空之前的批注内容
  annotationText.value = ''
  
  // 显示批注输入框
  showAnnotationBox.value = true
}

// 关闭批注框
function closeAnnotationBox() {
  showAnnotationBox.value = false
  annotationText.value = ''
}

// 保存批注
async function saveAnnotation() {
  if (!annotationText.value.trim()) {
    alert('请输入批注内容')
    return
  }
  
  try {
    // 调用 API 保存批注到数据库
    const result = await window.electronAPI.saveAnnotation({
      bookId: props.book.id,
      cfi: selectedCfi.value,
      selectedText: selectedText.value,
      annotation: annotationText.value,
      color: '#FFEB3B'
    })
    
    if (result.success) {
      alert('批注保存成功！')
      closeAnnotationBox()
      
      // 重新加载批注并高亮显示
      await loadAnnotations()
    } else {
      alert('批注保存失败: ' + (result.error || '未知错误'))
    }
  } catch (error) {
    console.error('保存批注失败:', error)
    alert('批注保存失败: ' + error.message)
  }
}

// 监听全局点击事件，点击其他地方关闭菜单
onMounted(() => {
  document.addEventListener('click', closeContextMenu)
  // 监听全局右键事件
  document.addEventListener('contextmenu', handleContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
  document.removeEventListener('contextmenu', handleContextMenu)
})
</script>
