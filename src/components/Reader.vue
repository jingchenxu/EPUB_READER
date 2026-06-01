<template>
  <div v-if="book" class="reader-container" :class="{ 'dark-mode': isDarkMode }">
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useBookStore } from '../stores/bookStore'
import ePub from 'epubjs'
import { buildFileUrl } from '../utils/pathHelper'

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
const isDarkMode = ref(false)
const progressBarRef = ref(null)
let isDragging = false
const readMode = ref('scrolled')  // 默认滚动阅读
const isLoading = ref(true)  // 加载状态

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
  console.log('=== Reader Component Mounted ===')
  console.log('Book prop:', props.book)
  console.log('Is production:', !import.meta.env.DEV)
  
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
    console.log('=== Initializing Reader ===')
    console.log('Book:', props.book)
    console.log('Book path:', props.book.book_path)
    
    if (!props.book.book_path) {
      throw new Error('Book path is undefined')
    }
    
    // 获取应用路径和用户数据目录
    const appPath = await window.electronAPI.getAppPath()
    const userDataPath = await window.electronAPI.getUserDataPath()
    
    // 使用路径工具函数构建书籍文件 URL
    const filePath = buildFileUrl(props.book.book_path, userDataPath, appPath)
    console.log('Loading EPUB from:', filePath)
    
    epubBook = ePub(filePath)
    console.log('EPUB instance created')
    
    // 监听 EPUB 加载事件
    epubBook.loaded.metadata.then((metadata) => {
      console.log('EPUB metadata loaded:', metadata)
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
    }

    rendition = epubBook.renderTo('viewer', renderOptions)
    console.log('Rendition created with flow:', readMode.value)

    // 通过 hooks.content 直接向 iframe 注入暗黑模式样式
    // 绕过 epubjs themes API 的不可靠切换问题
    rendition.hooks.content.register((contents) => {
      applyIframeTheme(contents)
    })
    console.log('Content hook registered')

    // 先不显示，等待加载 TOC 和恢复进度后再显示
    console.log('Loading TOC...')

    // 检查 viewer 容器的内容
    setTimeout(() => {
      const viewerElement = document.getElementById('viewer')
      if (viewerElement) {
        // 检查是否有 iframe
        const iframe = viewerElement.querySelector('iframe')
        if (!iframe) {
          console.warn('No iframe found in viewer!')
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
          console.warn('Resize failed:', e)
        }
      }
    }, 500)

    rendition.on('rendered', () => {
      console.log('Page rendered')
      const location = rendition.currentLocation()
      if (location) {
        console.log('Current location:', location)
        updateProgress(location)
      }
      
      // 每次页面渲染后重新设置右键监听
      setupIframeContextMenu()
    })

    rendition.on('relocated', (location) => {
      console.log('Page relocated:', location)
      updateProgress(location)
      saveProgress()
    })

    // 监听错误
    rendition.on('error', (error) => {
      console.error('Rendition error:', error)
    })
    
    // 监听 iframe 的右键事件
    setupIframeContextMenu()

    const loadedToc = await epubBook.loaded.navigation
    toc.value = loadedToc.toc
    console.log('TOC loaded:', toc.value.length, 'chapters')

    // 先显示内容，再生成 locations（优化首次加载速度）
    setTimeout(async () => {
      applyTheme()
      
      // 先尝试恢复上次阅读进度
      await bookStore.loadProgress(props.book.id)
      if (bookStore.currentProgress && bookStore.currentProgress.cfi) {
        console.log('Restoring last reading position:', bookStore.currentProgress.cfi)
        console.log('Progress percentage:', bookStore.currentProgress.percentage + '%')
        
        // 检查是否是封面或版权页，如果是则跳转到第一章
        const cfi = bookStore.currentProgress.cfi
        if (cfi.includes('titlepage') || cfi.includes('copyright') || cfi.includes('cover')) {
          console.log('Saved position is cover/copyright page, jumping to first chapter instead')
          // 继续执行下面的跳转到第一章逻辑
        } else {
          await rendition.display(cfi)
          isLoading.value = false  // 加载完成
          // 后台生成 locations（不阻塞显示）
          generateLocationsInBackground()
          return  // 直接返回，不执行后面的跳转逻辑
        }
      } else {
        // 如果没有阅读进度，跳转到目录中的第一个章节（跳过封面和版权页）
        console.log('No saved progress, jumping to first chapter')
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
            console.log('Jumping to first chapter:', firstChapter.label)
            await rendition.display(firstChapter.href)
          } else {
            console.log('No suitable chapter found, displaying from start')
            await rendition.display()  // 从开头显示
          }
        } else {
          console.log('TOC is empty, displaying from start')
          await rendition.display()  // 从开头显示
        }
      }
      
      isLoading.value = false  // 加载完成
      console.log('=== Reader Initialized Successfully ===')
      
      // 后台生成 locations（不阻塞显示）
      generateLocationsInBackground()
    }, 300)  // 减少等待时间到 300ms
  } catch (error) {
    console.error('=== Failed to initialize reader ===')
    console.error('Error:', error)
    console.error('Error stack:', error.stack)
    alert('无法打开书籍文件: ' + error.message)
    emit('close')
  }
}

// 后台生成 locations（不阻塞首次显示）
async function generateLocationsInBackground() {
  try {
    console.log('Generating locations in background...')
    const startTime = Date.now()
    await epubBook.locations.generate(160)  // 每 160 个字符一个位置
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`Locations generated in ${duration}s:`, epubBook.locations.length)
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
      console.log('Scroll mode - Raw percentage:', rawPercentage, 'Type:', typeof rawPercentage)
      
      if (rawPercentage !== undefined && rawPercentage !== null && rawPercentage > 0) {
        currentPercentage.value = Math.round(rawPercentage * 100)
        console.log('Using raw percentage:', currentPercentage.value + '%')
      } else {
        // 如果 percentage 不可用或为0，尝试其他方法
        console.warn('Percentage not available or is 0, trying alternative methods...')
        
        // 尝试使用 CFI 来估算进度（需要加载完整的 locations）
        if (epubBook && epubBook.locations) {
          const cfi = location.start.cfi
          const percentage = epubBook.locations.percentageFromCfi(cfi)
          if (percentage !== undefined && percentage !== null) {
            currentPercentage.value = Math.round(percentage * 100)
            console.log('Using locations percentage:', currentPercentage.value + '%')
          } else {
            currentPercentage.value = 0
            console.log('Locations percentage also unavailable')
          }
        } else {
          currentPercentage.value = 0
          console.log('No locations available')
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
    
    console.log('Location data:', {
      mode: readMode.value,
      page: currentPage.value,
      total: totalPages.value,
      percentage: currentPercentage.value + '%',
      rawPercentage: location.start.percentage,
      cfi: location.start.cfi
    })
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
  console.log('jumpToPercent called with:', percent + '%')

  try {
    // 尝试通过 locations 计算 CFI 并跳转
    const locs = epubBook.locations
    const locCount = locs && (locs._locations ? locs._locations.length : locs.length)
    console.log('Locations count:', locCount)

    if (locCount > 0) {
      const cfi = locs.cfiFromPercentage(percent / 100)
      console.log('CFI from percentage:', cfi)
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
      console.log('Fallback: jumping to spine index', idx, 'of', spine.length)
      if (target) {
        rendition.display(target.href || target.idref)
        return
      }
    }

    console.warn('No valid jump target found for', percent + '%')
  } catch (e) {
    console.error('Failed to jump to percentage:', e)
  }
}

function handleProgressClick(event) {
  console.log('handleProgressClick fired, isDragging:', isDragging)
  if (isDragging) return
  const percent = getPercentFromEvent(event)
  console.log('Click percent:', percent)
  jumpToPercent(percent)
}

function handleProgressMouseDown(event) {
  console.log('handleProgressMouseDown fired')
  isDragging = true
  const percent = getPercentFromEvent(event)
  console.log('Mousedown percent:', percent)
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
    await bookStore.saveProgress({
      bookId: props.book.id,
      cfi: location.start.cfi,
      page: location.start.displayed.page,
      percentage: location.start.percentage
    })
  }
}

async function loadBookmarks() {
  await bookStore.loadBookmarks(props.book.id)
  bookmarks.value = bookStore.bookmarks
}

// 加载批注
async function loadAnnotations() {
  try {
    console.log('Loading annotations for book:', props.book.id)
    const loadedAnnotations = await window.electronAPI.getAnnotations(props.book.id)
    annotations.value = loadedAnnotations
    console.log('Loaded', loadedAnnotations.length, 'annotations')
    
    // 在文本上标记批注
    highlightAnnotations()
  } catch (error) {
    console.error('Failed to load annotations:', error)
  }
}

// 高亮显示批注
function highlightAnnotations() {
  if (!rendition || !annotations.value.length) return
  
  console.log('Highlighting', annotations.value.length, 'annotations')
  
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
      console.log('Highlighted annotation:', annotation.id)
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
  
  // 定位弹窗
  popup.style.position = 'fixed'
  popup.style.left = (event.clientX + 10) + 'px'
  popup.style.top = (event.clientY + 10) + 'px'
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

function applyTheme() {
  if (rendition) {
    rendition.themes.fontSize(`${fontSize.value}px`)
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

  if (dark) {
    // 注入暗黑模式样式（!important 覆盖 EPUB 自带样式）
    const style = doc.createElement('style')
    style.id = 'rosa-theme-style'
    style.textContent = `
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
    head.appendChild(style)
  }
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
    console.warn('getContents failed:', e)
  }
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
  refreshAllIframesTheme()
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
  
  console.log('Changing read mode to:', readMode.value)
  
  // 保存当前位置
  const location = rendition.currentLocation()
  const currentCfi = location?.start?.cfi
  console.log('Saving current position:', currentCfi)
  
  // 销毁当前渲染
  rendition.destroy()
  
  // 重新创建渲染
  setTimeout(async () => {
    try {
      console.log('Creating new rendition with flow:', readMode.value)
      
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
      }
      
      rendition = epubBook.renderTo('viewer', renderOptions)
      console.log('Rendition created with options:', renderOptions)
      
      // 注册内容钩子以应用主题
      rendition.hooks.content.register((contents) => {
        applyIframeTheme(contents)
      })
      console.log('Content hook registered')
      
      // 恢复到之前的位置或从开头开始
      if (currentCfi) {
        console.log('Displaying at saved position:', currentCfi)
        await rendition.display(currentCfi)
      } else {
        console.log('Displaying from beginning')
        await rendition.display()
      }
      console.log('Display completed')
      
      // 检查 viewer 容器的状态
      const viewerElement = document.getElementById('viewer')
      if (viewerElement) {
        console.log('Viewer element:', viewerElement)
        console.log('Viewer offsetWidth:', viewerElement.offsetWidth)
        console.log('Viewer offsetHeight:', viewerElement.offsetHeight)
        console.log('Viewer scrollHeight:', viewerElement.scrollHeight)
        console.log('Viewer children:', viewerElement.children.length)
        
        const iframe = viewerElement.querySelector('iframe')
        if (iframe) {
          console.log('Iframe found')
          console.log('Iframe offsetWidth:', iframe.offsetWidth)
          console.log('Iframe offsetHeight:', iframe.offsetHeight)
          console.log('Iframe style:', iframe.style.cssText)
          
          // 如果是滚动模式且宽度为0，强制设置宽度
          if (readMode.value === 'scrolled' && iframe.offsetWidth === 0) {
            console.warn('Iframe width is 0 in scrolled mode, fixing...')
            const container = iframe.parentElement
            if (container) {
              container.style.width = viewerElement.offsetWidth + 'px'
              iframe.style.width = viewerElement.offsetWidth + 'px'
              console.log('Fixed iframe width to:', viewerElement.offsetWidth)
            }
          }
        } else {
          console.warn('No iframe found in viewer!')
        }
      }
      
      // 重新绑定事件
      rendition.on('rendered', () => {
        console.log('Page rendered in new mode')
        const location = rendition.currentLocation()
        if (location) {
          updateProgress(location)
        }
      })
      
      rendition.on('relocated', (location) => {
        console.log('Page relocated in new mode')
        updateProgress(location)
        saveProgress()
      })
      
      // 重新设置 iframe 的右键事件监听
      setupIframeContextMenu()
      
      console.log('Read mode changed successfully')
    } catch (error) {
      console.error('Failed to change read mode:', error)
      alert('切换阅读模式失败: ' + error.message)
    }
  }, 200)
}

// 右键菜单处理
function handleContextMenu(event) {
  console.log('handleContextMenu called')
  
  // 获取选中的文本
  const selection = window.getSelection()
  const text = selection.toString().trim()
  
  console.log('Selected text:', text ? text.substring(0, 50) : '(empty)')
  
  if (!text) {
    // 没有选中文本，不显示菜单
    console.log('No text selected, skipping menu')
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
      console.log('Selected CFI:', cfi)
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
  
  console.log('✅ Context menu shown for text:', text.substring(0, 50))
  console.log('Menu position:', contextMenuPosition.value)
}

// 设置 iframe 的右键事件监听
function setupIframeContextMenu() {
  console.log('Setting up iframe contextmenu listener...')
  
  const trySetupListener = (attempt = 0) => {
    const viewerElement = document.getElementById('viewer')
    if (!viewerElement) {
      console.warn('Viewer element not found')
      return false
    }
    
    const iframe = viewerElement.querySelector('iframe')
    if (!iframe) {
      console.warn(`No iframe found in viewer (attempt ${attempt + 1})`)
      return false
    }
    
    console.log('Iframe found:', iframe.id || 'unknown')
    
    try {
      // 检查 iframe 是否已加载
      if (!iframe.contentDocument) {
        console.warn('Iframe contentDocument not ready yet')
        return false
      }
      
      console.log('Iframe contentDocument accessible:', !!iframe.contentDocument)
      console.log('Iframe src:', iframe.src)
      
      // 监听 iframe 内部的右键事件
      iframe.contentDocument.addEventListener('contextmenu', (event) => {
        console.log('Iframe contextmenu triggered at:', event.clientX, event.clientY)
        
        // 从 iframe 内部获取选中的文本
        const iframeSelection = iframe.contentWindow.getSelection()
        const text = iframeSelection.toString().trim()
        
        console.log('Text from iframe selection:', text ? text.substring(0, 50) : '(empty)')
        
        if (!text) {
          console.log('No text selected in iframe, skipping menu')
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
              console.log('Selected CFI:', cfi)
            } else {
              console.warn('No content available for CFI generation')
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
        let menuX = event.clientX
        let menuY = event.clientY
        
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
        
        console.log('✅ Context menu shown for text:', text.substring(0, 50))
        console.log('Menu position:', { x: menuX, y: menuY })
      })
      console.log('✅ Iframe contextmenu listener added successfully')
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
    console.log(`Retrying iframe listener setup (${attempts}/${maxAttempts})...`)
    
    if (trySetupListener(attempts)) {
      clearInterval(retryInterval)
      console.log('✅ Iframe listener setup successful after retries')
    } else if (attempts >= maxAttempts) {
      clearInterval(retryInterval)
      console.error('❌ Failed to setup iframe listener after maximum attempts')
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
  console.log('提取文本:', selectedText.value)
  console.log('CFI:', selectedCfi.value)
  // TODO: 实现摘抄保存到数据库
  alert('已摘抄：' + selectedText.value.substring(0, 50) + '...')
}

// 批注功能
function handleAnnotate() {
  closeContextMenu()
  console.log('批注文本:', selectedText.value)
  console.log('CFI:', selectedCfi.value)
  
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
  
  console.log('保存批注:', {
    text: selectedText.value,
    cfi: selectedCfi.value,
    annotation: annotationText.value,
    bookId: props.book.id
  })
  
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
      console.log('批注保存成功，ID:', result.id)
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
