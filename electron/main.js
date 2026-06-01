const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const Database = require('better-sqlite3')
const AdmZip = require('adm-zip')
const xml2js = require('xml2js')

let mainWindow
let db

// 生成文件的 SHA256 hash 值
function generateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(filePath)
    
    stream.on('data', (chunk) => {
      hash.update(chunk)
    })
    
    stream.on('end', () => {
      resolve(hash.digest('hex'))
    })
    
    stream.on('error', (error) => {
      reject(error)
    })
  })
}

// 从 EPUB 文件中提取元数据
async function extractEpubMetadata(filePath) {
  try {
    console.log('Extracting metadata from:', filePath)
    const zip = new AdmZip(filePath)
    
    // 读取 container.xml 找到 content.opf 的位置
    const containerXml = zip.readAsText('META-INF/container.xml')
    if (!containerXml) {
      throw new Error('Invalid EPUB: container.xml not found')
    }
    
    const containerParser = new xml2js.Parser()
    const container = await containerParser.parseStringPromise(containerXml)
    const rootFilePath = container.container.rootfiles[0].rootfile[0].$['full-path']
    
    // 读取 content.opf 文件
    const opfXml = zip.readAsText(rootFilePath)
    if (!opfXml) {
      throw new Error('Invalid EPUB: content.opf not found')
    }
    
    const opfParser = new xml2js.Parser()
    const opf = await opfParser.parseStringPromise(opfXml)
    const metadata = opf.package.metadata[0]
    
    // 提取基本信息
    const bookInfo = {
      title: metadata['dc:title'] ? metadata['dc:title'][0] : path.basename(filePath, '.epub'),
      author: metadata['dc:creator'] ? (Array.isArray(metadata['dc:creator']) ? metadata['dc:creator'][0]._ || metadata['dc:creator'][0] : metadata['dc:creator']) : '未知作者',
      publisher: metadata['dc:publisher'] ? (Array.isArray(metadata['dc:publisher']) ? metadata['dc:publisher'][0] : metadata['dc:publisher']) : null,
      isbn: metadata['dc:identifier'] ? findISBN(metadata['dc:identifier']) : null,
      pubDate: metadata['dc:date'] ? (Array.isArray(metadata['dc:date']) ? metadata['dc:date'][0] : metadata['dc:date']) : null,
      language: metadata['dc:language'] ? (Array.isArray(metadata['dc:language']) ? metadata['dc:language'][0] : metadata['dc:language']) : null,
      description: metadata['dc:description'] ? (Array.isArray(metadata['dc:description']) ? metadata['dc:description'][0] : metadata['dc:description']) : null,
      coverPath: null,
      bookPath: null
    }
    
    // 提取封面图片
    const manifest = opf.package.manifest[0].item
    const spine = opf.package.spine[0]
    
    // 查找封面 ID
    let coverId = null
    if (metadata.meta) {
      const coverMeta = Array.isArray(metadata.meta) ? metadata.meta.find(m => m.$ && m.$.name === 'cover') : null
      if (coverMeta) {
        coverId = coverMeta.$.content
      }
    }
    
    // 如果没有通过 meta 标签找到，尝试查找名为 'cover' 的项目
    if (!coverId && manifest) {
      const coverItem = Array.isArray(manifest) ? manifest.find(item => item.$.id === 'cover' || item.$.id === 'cover-image') : null
      if (coverItem) {
        coverId = coverItem.$.id
      }
    }
    
    // 提取封面图片
    if (coverId && manifest) {
      const coverItem = Array.isArray(manifest) ? manifest.find(item => item.$.id === coverId) : null
      if (coverItem) {
        const coverHref = coverItem.$.href
        const coverPath = path.join(path.dirname(rootFilePath), coverHref).replace(/\\/g, '/')
        const coverBuffer = zip.readFile(coverPath)
        
        if (coverBuffer) {
          // 保存封面到用户数据目录
          const userDataPath = app.getPath('userData')
          const coverFileName = `cover_${Date.now()}.jpg`
          const coverSavePath = path.join(userDataPath, 'upload', 'covers', coverFileName)
          
          // 创建 covers 文件夹
          const coversDir = path.dirname(coverSavePath)
          if (!fs.existsSync(coversDir)) {
            fs.mkdirSync(coversDir, { recursive: true })
          }
          
          fs.writeFileSync(coverSavePath, coverBuffer)
          bookInfo.coverPath = path.join('upload', 'covers', coverFileName)
          console.log('Cover saved to:', bookInfo.coverPath)
        }
      }
    }
    
    // 复制 EPUB 文件到用户数据目录
    const userDataPath = app.getPath('userData')
    const bookFileName = `book_${Date.now()}_${path.basename(filePath)}`
    const bookSavePath = path.join(userDataPath, 'upload', 'books', bookFileName)
    
    // 创建 books 文件夹
    const booksDir = path.dirname(bookSavePath)
    if (!fs.existsSync(booksDir)) {
      fs.mkdirSync(booksDir, { recursive: true })
    }
    
    // 复制文件
    fs.copyFileSync(filePath, bookSavePath)
    bookInfo.bookPath = path.join('upload', 'books', bookFileName)
    console.log('Book copied to:', bookInfo.bookPath)
    
    console.log('Extracted metadata:', bookInfo)
    return bookInfo
  } catch (error) {
    console.error('Error extracting EPUB metadata:', error)
    // 返回默认值
    return {
      title: path.basename(filePath, '.epub'),
      author: '未知作者',
      coverPath: null,
      bookPath: null
    }
  }
}

// 从 identifier 中查找 ISBN
function findISBN(identifiers) {
  if (!identifiers) return null
  
  const idList = Array.isArray(identifiers) ? identifiers : [identifiers]
  
  for (const id of idList) {
    const idStr = typeof id === 'object' ? (id._ || id) : id
    // ISBN-13: 978 开头，13 位数字
    // ISBN-10: 10 位数字或带 X
    if (idStr && (idStr.match(/^978\d{10}$/) || idStr.match(/^\d{9}[\dX]$/i))) {
      return idStr
    }
  }
  
  return null
}

function createDatabase() {
  console.log('=== Initializing Database ===')
  
  // 使用用户数据目录存储数据库
  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'db')
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
    console.log('Created database directory:', dbDir)
  }
  
  const dbPath = path.join(dbDir, 'epub_reader.db')
  console.log('Database path:', dbPath)
  
  db = new Database(dbPath)
  console.log('Database instance created')
  
  // 启用 WAL 模式以提高性能
  db.pragma('journal_mode = WAL')
  console.log('WAL mode enabled')
  
  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      publisher TEXT,
      isbn TEXT,
      pub_date TEXT,
      language TEXT,
      description TEXT,
      cover_path TEXT,
      book_path TEXT UNIQUE NOT NULL,
      file_hash TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_read_at DATETIME
    )
  `)
  console.log('Books table created/verified')
  
  // 检查并添加 file_hash 列（如果不存在）
  try {
    const columns = db.prepare("PRAGMA table_info(books)").all()
    const hasHashColumn = columns.some(col => col.name === 'file_hash')
    if (!hasHashColumn) {
      db.exec('ALTER TABLE books ADD COLUMN file_hash TEXT')
      console.log('Added file_hash column to books table')
    }
  } catch (error) {
    console.error('Error checking/adding file_hash column:', error)
  }
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS reading_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL UNIQUE,
      cfi TEXT,
      page INTEGER DEFAULT 0,
      percentage REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `)
  console.log('Reading progress table created/verified')
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      cfi TEXT NOT NULL,
      title TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `)
  console.log('Bookmarks table created/verified')
  
  // 创建批注表
  db.exec(`
    CREATE TABLE IF NOT EXISTS annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      cfi TEXT NOT NULL,
      selected_text TEXT NOT NULL,
      annotation TEXT NOT NULL,
      color TEXT DEFAULT '#FFEB3B',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `)
  console.log('Annotations table created/verified')
  
  // 创建分类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#667eea',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('Categories table created/verified')
  
  // 为 books 表添加 category_id 字段（如果不存在）
  try {
    db.exec(`ALTER TABLE books ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL`)
    console.log('Added category_id column to books table')
  } catch (error) {
    // 列已存在，忽略错误
    console.log('category_id column already exists')
  }
  
  console.log('=== Database Initialized Successfully ===')
}

function createWindow() {
  // 仅在生产环境隐藏菜单栏
  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'development') {
    Menu.setApplicationMenu(null)
  }
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../public/logo-256.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  console.log('=== App Ready ===')
  
  // 仅在生产环境隐藏默认菜单栏
  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'development') {
    Menu.setApplicationMenu(null)
  }
  
  createDatabase()
  console.log('=== Database Initialized ===')
  createWindow()
  console.log('=== Window Created ===')

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('open-epub', async () => {
  console.log('open-epub IPC handler called')
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'EPUB Files', extensions: ['epub'] }]
    })
    console.log('Dialog result:', result)

    if (!result.canceled && result.filePaths.length > 0) {
      console.log(`Selected ${result.filePaths.length} file(s)`)
      
      const addedBooks = []
      const skippedBooks = []
      
      for (const filePath of result.filePaths) {
        console.log('Processing file:', filePath)
        
        try {
          // 生成文件 hash
          const fileHash = await generateFileHash(filePath)
          console.log('File hash:', fileHash)
          
          // 检查书籍是否已存在（通过路径或 hash）
          const existingBook = db.prepare('SELECT * FROM books WHERE book_path = ? OR file_hash = ?').get(filePath, fileHash)
          if (existingBook) {
            console.log('Book already exists (by path or hash), skipping:', filePath)
            skippedBooks.push(filePath)
            continue
          }
          
          // 提取 EPUB 元数据
          const metadata = await extractEpubMetadata(filePath)
          console.log('Extracted metadata:', metadata)
          
          // 保存到数据库（包含 hash）
          const stmt = db.prepare(`
            INSERT OR IGNORE INTO books (title, author, publisher, isbn, pub_date, language, description, cover_path, book_path, file_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          const insertResult = stmt.run(
            metadata.title,
            metadata.author,
            metadata.publisher || null,
            metadata.isbn || null,
            metadata.pubDate || null,
            metadata.language || null,
            metadata.description || null,
            metadata.coverPath || null,
            metadata.bookPath,
            fileHash
          )
          
          if (insertResult.changes > 0) {
            console.log('Book saved to database:', metadata.title)
            const book = db.prepare('SELECT * FROM books WHERE id = ?').get(insertResult.lastInsertRowid)
            addedBooks.push(book)
          } else {
            console.log('Book was not inserted (possibly duplicate):', metadata.title)
            skippedBooks.push(filePath)
          }
        } catch (error) {
          console.error('Error processing file:', filePath, error)
          // 继续处理下一个文件
        }
      }
      
      console.log(`Added: ${addedBooks.length}, Skipped: ${skippedBooks.length}`)
      
      // 返回添加的书籍列表和跳过的数量
      return {
        success: true,
        added: addedBooks,
        skipped: skippedBooks.length,
        total: result.filePaths.length
      }
    } else {
      console.log('Dialog canceled or no files selected')
      return { success: false, added: [], skipped: 0, total: 0 }
    }
  } catch (error) {
    console.error('Error in open-epub handler:', error)
    return { success: false, added: [], skipped: 0, total: 0, error: error.message }
  }
})

ipcMain.handle('get-books', (event, categoryId) => {
  try {
    let query = 'SELECT * FROM books'
    let params = []
    
    if (categoryId !== null && categoryId !== undefined) {
      query += ' WHERE category_id = ?'
      params.push(categoryId)
    }
    
    query += ' ORDER BY last_read_at DESC, added_at DESC'
    
    console.log('Query:', query, 'Params:', params)
    const books = db.prepare(query).all(...params)
    console.log('Books returned:', books.length, books.map(b => ({ id: b.id, title: b.title, category_id: b.category_id })))
    return books
  } catch (error) {
    console.error('Error getting books:', error)
    return []
  }
})

// 获取所有分类
ipcMain.handle('get-categories', () => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY created_at ASC').all()
    return categories
  } catch (error) {
    console.error('Error getting categories:', error)
    return []
  }
})

// 添加分类
ipcMain.handle('add-category', (event, name, color = '#667eea') => {
  try {
    const result = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)').run(name, color)
    return { id: result.lastInsertRowid, name, color }
  } catch (error) {
    console.error('Error adding category:', error)
    return null
  }
})

// 删除分类
ipcMain.handle('delete-category', (event, categoryId) => {
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(categoryId)
    return true
  } catch (error) {
    console.error('Error deleting category:', error)
    return false
  }
})

// 更新书籍分类
ipcMain.handle('update-book-category', (event, bookId, categoryId) => {
  try {
    db.prepare('UPDATE books SET category_id = ? WHERE id = ?').run(categoryId, bookId)
    return true
  } catch (error) {
    console.error('Error updating book category:', error)
    return false
  }
})

// 导出书籍文件
ipcMain.handle('export-book', async (event, bookId) => {
  try {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId)
    if (!book) {
      return { success: false, error: 'Book not found' }
    }
    
    const { dialog } = require('electron')
    const result = await dialog.showSaveDialog({
      title: '导出书籍',
      defaultPath: `${book.title}.epub`,
      filters: [
        { name: 'EPUB Files', extensions: ['epub'] }
      ]
    })
    
    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Cancelled' }
    }
    
    const fs = require('fs')
    const path = require('path')
    const userDataPath = app.getPath('userData')
    const sourcePath = path.join(userDataPath, book.book_path)
    
    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: 'Source file not found' }
    }
    
    fs.copyFileSync(sourcePath, result.filePath)
    return { success: true, path: result.filePath }
  } catch (error) {
    console.error('Error exporting book:', error)
    return { success: false, error: error.message }
  }
})

// 导出笔记
ipcMain.handle('export-notes', async (event, bookId) => {
  try {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId)
    if (!book) {
      return { success: false, error: 'Book not found' }
    }
    
    // 获取批注和书签
    const annotations = db.prepare('SELECT * FROM annotations WHERE book_id = ? ORDER BY created_at ASC').all(bookId)
    const bookmarks = db.prepare('SELECT * FROM bookmarks WHERE book_id = ? ORDER BY created_at ASC').all(bookId)
    
    // 生成文本格式的笔记
    let content = `《${book.title}》 - 阅读笔记\n`
    content += `作者：${book.author || '未知'}\n`
    content += `导出时间：${new Date().toLocaleString()}\n`
    content += `\n${'='.repeat(50)}\n\n`
    
    if (annotations.length > 0) {
      content += `【批注】（共 ${annotations.length} 条）\n\n`
      annotations.forEach((anno, index) => {
        content += `${index + 1}. ${anno.selected_text}\n`
        content += `   批注：${anno.annotation}\n`
        content += `   时间：${anno.created_at}\n\n`
      })
      content += `\n${'-'.repeat(50)}\n\n`
    }
    
    if (bookmarks.length > 0) {
      content += `【书签】（共 ${bookmarks.length} 个）\n\n`
      bookmarks.forEach((bookmark, index) => {
        content += `${index + 1}. ${bookmark.title || '书签'}\n`
        if (bookmark.note) {
          content += `   备注：${bookmark.note}\n`
        }
        content += `   时间：${bookmark.created_at}\n\n`
      })
    }
    
    const { dialog } = require('electron')
    const result = await dialog.showSaveDialog({
      title: '导出笔记',
      defaultPath: `${book.title}_笔记.txt`,
      filters: [
        { name: 'Text Files', extensions: ['txt'] }
      ]
    })
    
    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Cancelled' }
    }
    
    const fs = require('fs')
    fs.writeFileSync(result.filePath, content, 'utf-8')
    return { success: true, path: result.filePath }
  } catch (error) {
    console.error('Error exporting notes:', error)
    return { success: false, error: error.message }
  }
})

// 彻底删除书籍
ipcMain.handle('delete-book-completely', (event, bookId) => {
  try {
    const fs = require('fs')
    const path = require('path')
    
    // 先获取书籍信息
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId)
    if (!book) {
      return { success: false, error: 'Book not found' }
    }
    
    // 删除书籍文件
    if (book.book_path) {
      const userDataPath = app.getPath('userData')
      const bookFilePath = path.join(userDataPath, book.book_path)
      if (fs.existsSync(bookFilePath)) {
        fs.unlinkSync(bookFilePath)
      }
    }
    
    // 删除封面文件
    if (book.cover_path) {
      const userDataPath = app.getPath('userData')
      const coverFilePath = path.join(userDataPath, book.cover_path)
      if (fs.existsSync(coverFilePath)) {
        fs.unlinkSync(coverFilePath)
      }
    }
    
    // 删除数据库记录（会自动级联删除相关进度、批注、书签）
    db.prepare('DELETE FROM books WHERE id = ?').run(bookId)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting book completely:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('save-progress', (event, data) => {
  try {
    const { bookId, cfi, page, percentage } = data
    db.prepare(`
      INSERT INTO reading_progress (book_id, cfi, page, percentage)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(book_id) DO UPDATE SET
        cfi = excluded.cfi,
        page = excluded.page,
        percentage = excluded.percentage,
        updated_at = CURRENT_TIMESTAMP
    `).run(bookId, cfi, page, percentage)
    
    db.prepare('UPDATE books SET last_read_at = CURRENT_TIMESTAMP WHERE id = ?').run(bookId)
    return true
  } catch (error) {
    console.error('Error saving progress:', error)
    return false
  }
})

ipcMain.handle('get-progress', (event, bookId) => {
  try {
    const progress = db.prepare('SELECT * FROM reading_progress WHERE book_id = ?').get(bookId)
    return progress
  } catch (error) {
    console.error('Error getting progress:', error)
    return null
  }
})

ipcMain.handle('add-bookmark', (event, data) => {
  try {
    const { bookId, cfi, title, note } = data
    const result = db.prepare('INSERT INTO bookmarks (book_id, cfi, title, note) VALUES (?, ?, ?, ?)').run(bookId, cfi, title, note)
    return { id: result.lastInsertRowid }
  } catch (error) {
    console.error('Error adding bookmark:', error)
    return null
  }
})

ipcMain.handle('get-bookmarks', (event, bookId) => {
  try {
    const bookmarks = db.prepare('SELECT * FROM bookmarks WHERE book_id = ? ORDER BY created_at DESC').all(bookId)
    return bookmarks
  } catch (error) {
    console.error('Error getting bookmarks:', error)
    return []
  }
})

ipcMain.handle('delete-bookmark', (event, bookmarkId) => {
  try {
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(bookmarkId)
    return true
  } catch (error) {
    console.error('Error deleting bookmark:', error)
    return false
  }
})

ipcMain.handle('delete-book', (event, bookId) => {
  try {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId)
    if (book) {
      db.prepare('DELETE FROM books WHERE id = ?').run(bookId)
      return true
    }
    return false
  } catch (error) {
    console.error('Error deleting book:', error)
    return false
  }
})

// 保存批注
ipcMain.handle('save-annotation', (event, data) => {
  try {
    console.log('Saving annotation:', data)
    const stmt = db.prepare(`
      INSERT INTO annotations (book_id, cfi, selected_text, annotation, color)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      data.bookId,
      data.cfi,
      data.selectedText,
      data.annotation,
      data.color || '#FFEB3B'
    )
    console.log('Annotation saved with ID:', result.lastInsertRowid)
    return { success: true, id: result.lastInsertRowid }
  } catch (error) {
    console.error('Error saving annotation:', error)
    return { success: false, error: error.message }
  }
})

// 获取书籍的所有批注
ipcMain.handle('get-annotations', (event, bookId) => {
  try {
    console.log('Getting annotations for book:', bookId)
    const annotations = db.prepare(`
      SELECT * FROM annotations 
      WHERE book_id = ? 
      ORDER BY created_at ASC
    `).all(bookId)
    console.log('Found', annotations.length, 'annotations')
    return annotations
  } catch (error) {
    console.error('Error getting annotations:', error)
    return []
  }
})

// 删除批注
ipcMain.handle('delete-annotation', (event, annotationId) => {
  try {
    console.log('Deleting annotation:', annotationId)
    db.prepare('DELETE FROM annotations WHERE id = ?').run(annotationId)
    return true
  } catch (error) {
    console.error('Error deleting annotation:', error)
    return false
  }
})

ipcMain.handle('get-app-path', () => {
  return app.getAppPath()
})

// 获取用户数据目录路径
ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData')
})

// 打开阅读器窗口
ipcMain.handle('open-reader-window', (event, book) => {
  try {
    console.log('Opening reader window for book:', book)
    
    // 隐藏默认菜单栏
    Menu.setApplicationMenu(null)
    
    // 创建新的浏览器窗口
    const readerWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: path.join(__dirname, '../public/logo-256.ico'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: false,
        allowRunningInsecureContent: true
      }
    })
    
    // 设置窗口标题
    readerWindow.setTitle(book.title || 'EPUB Reader')
    
    // 开发环境打开开发者工具
    if (process.env.NODE_ENV === 'development') {
      readerWindow.webContents.openDevTools()
    }
    
    // 加载应用，并传递书籍信息
    const isDev = !app.isPackaged
    if (isDev) {
      // 开发环境：加载 Vite 开发服务器
      readerWindow.loadURL(`http://localhost:5173?bookId=${book.id}&bookTitle=${encodeURIComponent(book.title)}&bookPath=${encodeURIComponent(book.book_path)}`)
    } else {
      // 生产环境：加载打包后的文件
      readerWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
        search: `bookId=${book.id}&bookTitle=${encodeURIComponent(book.title)}&bookPath=${encodeURIComponent(book.book_path)}`
      })
    }
    
    console.log('Reader window created successfully')
    return true
  } catch (error) {
    console.error('Error opening reader window:', error)
    return false
  }
})

// 获取存储信息
ipcMain.handle('get-storage-info', () => {
  try {
    const userDataPath = app.getPath('userData')
    const uploadPath = path.join(userDataPath, 'upload')
    
    let booksSize = 0
    if (fs.existsSync(uploadPath)) {
      const calcDirSize = (dirPath) => {
        let totalSize = 0
        const files = fs.readdirSync(dirPath)
        for (const file of files) {
          const filePath = path.join(dirPath, file)
          const stats = fs.statSync(filePath)
          if (stats.isDirectory()) {
            totalSize += calcDirSize(filePath)
          } else {
            totalSize += stats.size
          }
        }
        return totalSize
      }
      booksSize = calcDirSize(uploadPath)
    }
    
    let diskFree = 0
    try {
      const drive = userDataPath.charAt(0).toUpperCase()
      const { execSync } = require('child_process')
      const output = execSync(`wmic logicaldisk where "DeviceID='${drive}:'" get FreeSpace /value`, { encoding: 'utf-8' })
      const match = output.match(/FreeSpace=(\d+)/)
      if (match) diskFree = parseInt(match[1])
    } catch (e) {
      console.error('Failed to get disk free space:', e)
    }
    
    const dbPath = path.join(userDataPath, 'db', 'epub_reader.db')
    let cacheSize = 0
    if (fs.existsSync(dbPath)) {
      cacheSize += fs.statSync(dbPath).size
    }
    const dbWalPath = dbPath + '-wal'
    if (fs.existsSync(dbWalPath)) {
      cacheSize += fs.statSync(dbWalPath).size
    }
    const dbShmPath = dbPath + '-shm'
    if (fs.existsSync(dbShmPath)) {
      cacheSize += fs.statSync(dbShmPath).size
    }
    
    return {
      savePath: userDataPath,
      booksSize,
      diskFree,
      cacheSize
    }
  } catch (error) {
    console.error('Error getting storage info:', error)
    return { savePath: '', booksSize: 0, diskFree: 0, cacheSize: 0 }
  }
})

ipcMain.handle('select-save-path', async () => {
  try {
    const result = await dialog.showOpenDialog({
      title: '选择文件保存位置',
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, path: result.filePaths[0] }
    }
    return { success: false }
  } catch (error) {
    console.error('Error selecting save path:', error)
    return { success: false }
  }
})

ipcMain.handle('clear-cache', () => {
  try {
    const userDataPath = app.getPath('userData')
    let clearedSize = 0
    const dbWalPath = path.join(userDataPath, 'db', 'epub_reader.db-wal')
    const dbShmPath = path.join(userDataPath, 'db', 'epub_reader.db-shm')
    if (fs.existsSync(dbWalPath)) {
      clearedSize += fs.statSync(dbWalPath).size
      fs.unlinkSync(dbWalPath)
    }
    if (fs.existsSync(dbShmPath)) {
      clearedSize += fs.statSync(dbShmPath).size
      fs.unlinkSync(dbShmPath)
    }
    if (db) {
      db.pragma('wal_checkpoint(TRUNCATE)')
    }
    return { success: true, clearedSize }
  } catch (error) {
    console.error('Error clearing cache:', error)
    return { success: false, error: error.message }
  }
})
