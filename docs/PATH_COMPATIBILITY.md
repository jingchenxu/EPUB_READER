# 路径处理兼容性说明

## 概述

本文档说明 EPUB Reader 应用中文件路径的处理方式，确保在**本地开发**和**打包安装**两种环境下都能正常工作。

## 核心设计

### 文件存储位置

所有用户上传的文件（EPUB 书籍、封面图片）都保存在**用户数据目录**中：

- **Windows**: `C:\Users\<用户名>\AppData\Roaming\epub-reader\`
- **macOS**: `/Users/<用户名>/Library/Application Support/epub-reader/`
- **Linux**: `/home/<用户名>/.config/epub-reader/`

目录结构：
```
epub-reader/
├── db/
│   └── epub_reader.db          # SQLite 数据库
└── upload/
    ├── books/                   # EPUB 书籍文件
    │   └── book_xxxxxx_xxx.epub
    └── covers/                  # 封面图片
        └── cover_xxxxxx.jpg
```

### 数据库存储路径

数据库中存储的是**相对路径**（相对于用户数据目录）：

```sql
-- books 表
book_path: "upload/books/book_123456_example.epub"
cover_path: "upload/covers/cover_123456.jpg"
```

## 路径构建逻辑

### 开发环境 vs 生产环境

```javascript
// 开发环境
appPath: "F:\ai_workspace\rosa"
userDataPath: "C:\Users\jingc\AppData\Roaming\epub-reader"

// 生产环境（打包后）
appPath: "C:\Program Files\EPUB Reader\resources\app.asar"
userDataPath: "C:\Users\jingc\AppData\Roaming\epub-reader"
```

**关键发现**：
- 主进程使用 `app.getPath('userData')` 保存文件
- 无论开发还是生产环境，文件都保存在 `userDataPath`
- 因此路径构建逻辑**统一使用 userDataPath**

### 路径构建函数

```javascript
// src/utils/pathHelper.js
export function buildFileUrl(relativePath, userDataPath, appPath) {
  // 标准化路径分隔符
  const normalizedPath = relativePath.replace(/\\/g, '/')
  
  // 检查是否是生产环境
  const isProduction = appPath && (
    appPath.includes('resources') && 
    appPath.includes('app.asar')
  )
  
  // 统一使用 userDataPath（开发和生产环境都如此）
  const absolutePath = `${userDataPath}/${normalizedPath}`
  
  // 转换为 file:// URL
  return `file:///${absolutePath}`
}
```

## 使用场景

### 1. 书架封面显示（Library.vue）

```javascript
function getCoverUrlSync(book) {
  if (!book.cover_path) return ''
  
  // 使用路径工具函数
  return buildFileUrl(
    book.cover_path,      // "upload/covers/cover_xxx.jpg"
    userDataPath.value,   // "C:\Users\jingc\AppData\Roaming\epub-reader"
    appPath.value         // 开发或生产环境路径
  )
  // 返回: "file:///C:/Users/jingc/AppData/Roaming/epub-reader/upload/covers/cover_xxx.jpg"
}
```

### 2. EPUB 书籍加载（Reader.vue）

```javascript
async function initReader() {
  const appPath = await window.electronAPI.getAppPath()
  const userDataPath = await window.electronAPI.getUserDataPath()
  
  // 使用路径工具函数
  const filePath = buildFileUrl(
    props.book.book_path,  // "upload/books/book_xxx.epub"
    userDataPath,
    appPath
  )
  
  epubBook = ePub(filePath)
}
```

## 兼容性保证

### ✅ 开发环境
- Vite 开发服务器运行在 `localhost:5173`
- 通过 `npm run electron:dev` 启动
- 文件路径：`userDataPath + relativePath`
- 示例：`C:\Users\jingc\AppData\Roaming\epub-reader\upload\covers\cover_xxx.jpg`

### ✅ 生产环境
- 打包后的应用安装在 `Program Files`
- 通过安装包运行
- 文件路径：`userDataPath + relativePath`
- 示例：`C:\Users\jingc\AppData\Roaming\epub-reader\upload\covers\cover_xxx.jpg`

**两种环境使用相同的路径构建逻辑！**

## 主进程配置

### 文件保存（electron/main.js）

```javascript
async function extractEpubMetadata(filePath) {
  const userDataPath = app.getPath('userData')
  
  // 保存封面
  const coverSavePath = path.join(userDataPath, 'upload', 'covers', coverFileName)
  bookInfo.coverPath = path.join('upload', 'covers', coverFileName)
  
  // 保存书籍
  const bookSavePath = path.join(userDataPath, 'upload', 'books', bookFileName)
  bookInfo.bookPath = path.join('upload', 'books', bookFileName)
}
```

**关键点**：
- 使用 `app.getPath('userData')` 获取用户数据目录
- 数据库中存储相对路径（`upload/covers/xxx.jpg`）
- 不使用 `app.getPath('exe')` 或 `__dirname`

## 常见问题

### Q: 为什么不用 appPath？
A: 
- 开发环境：appPath 是项目根目录（`F:\ai_workspace\rosa`）
- 生产环境：appPath 是 `resources/app.asar`（只读）
- 用户文件不能保存在应用目录中

### Q: 打包后文件会丢失吗？
A: 
- 不会！用户文件保存在 `userDataPath`
- `userDataPath` 在应用更新时保持不变
- 只有应用代码在 `resources/app.asar` 中更新

### Q: 如何调试路径问题？
A:
```javascript
// 在 pathHelper.js 中已添加详细日志
console.log('buildFileUrl:', {
  relativePath,
  userDataPath,
  appPath,
  isProduction,
  absolutePath,
  fileUrl
})
```

## 总结

| 环境 | appPath | userDataPath | 文件存储 | 路径构建 |
|------|---------|--------------|----------|----------|
| 开发 | `F:\ai_workspace\rosa` | `C:\Users\...\epub-reader` | userDataPath | ✅ 统一逻辑 |
| 生产 | `C:\Program Files\...\app.asar` | `C:\Users\...\epub-reader` | userDataPath | ✅ 统一逻辑 |

**核心原则**：所有用户数据统一存储在 `userDataPath`，路径构建使用统一逻辑，确保开发和生产环境完全兼容。
