# EPUB Reader - 桌面电子书阅读器

一个基于 Electron + Vue 3 + SQLite 的现代化 EPUB 电子书阅读器桌面应用。

## 📋 目录

- [功能特性](#-功能特性)
- [技术栈](#️-技术栈)
- [快速开始](#-快速开始)
- [安装与运行](#-安装与运行)
- [使用说明](#-使用说明)
- [打包部署](#-打包部署)
- [项目结构](#-项目结构)
- [Logo 与图标](#-logo-与图标)
- [常见问题](#-常见问题)
- [开发指南](#-开发指南)

---

## ✨ 功能特性

- 📚 **书架管理** - 添加、删除和管理你的 EPUB 书籍
- 📖 **阅读功能** - 流畅的 EPUB 文件渲染和阅读体验
- 🔖 **书签系统** - 添加、管理和快速跳转到书签
- 📑 **目录导航** - 快速浏览和跳转到书籍章节
- 💾 **进度保存** - 自动保存阅读进度,下次打开继续阅读
- 🎨 **字体调整** - 支持调整字体大小,舒适阅读
- 📝 **批注功能** - 选中文本添加批注和摘抄
- 💿 **数据持久化** - 使用 SQLite 数据库存储所有数据
- 🎯 **双模式阅读** - 支持翻页模式和滚动模式切换

## 🛠️ 技术栈

- **Electron** - 跨平台桌面应用框架 (v28.3.3)
- **Vue 3** - 渐进式 JavaScript 框架 (Composition API)
- **Vite** - 下一代前端构建工具
- **Pinia** - Vue 状态管理
- **EPUB.js** - EPUB 文件解析和渲染
- **better-sqlite3** - SQLite 数据库（原生 Node.js 版本）
- **electron-builder** - Electron 应用打包工具 (v24.13.3)

---

## 🚀 快速开始

### 方法一：使用 npm 脚本（最简单）

```bash
npm run build:win
```

### 方法二：直接运行脚本

**PowerShell**：
```powershell
.\build-windows.ps1
```

**命令提示符**：
```cmd
build-windows.bat
```

### 输出结果

打包成功后，安装包位于：
```
dist-electron\EPUB Reader Setup 1.0.0.exe
```

**提示**：首次打包可能需要较长时间（5-15分钟），因为需要下载 Electron 运行时和编译原生模块。

---

## 📦 安装

### 前置要求

- Node.js >= 18.x（推荐 v18 或更高版本）
- npm >= 9.x
- Visual Studio 2022 Build Tools（用于编译原生模块）

### 安装步骤

1. 克隆或下载项目到本地

2. 安装依赖：
```bash
npm install
```

**注意**：如果遇到 `better-sqlite3` 编译错误，请确保已安装 Visual Studio 2022。

---

## 🚀 运行

### 开发模式

启动开发服务器和 Electron 应用：

```bash
npm run electron:dev
```

这将同时启动 Vite 开发服务器和 Electron 窗口。

### 生产构建

构建可分发的应用程序：

```bash
npm run electron:build
```

或使用打包脚本：

```bash
npm run build:win
```

构建完成后，可在 `dist-electron` 目录中找到安装包。

---

## 🎯 使用说明

### 添加书籍

1. 点击“添加书籍”按钮
2. 选择本地的 EPUB 文件
3. 书籍将自动添加到书架

### 阅读书籍

1. 在书架上点击“阅读”按钮
2. 进入阅读界面
3. 使用工具栏进行翻页、调整字体等操作

### 添加书签

1. 在阅读界面，点击左侧边栏的“书签”标签
2. 点击“+ 添加书签”按钮
3. 输入标题和备注（可选）
4. 点击“保存”

### 查看目录

1. 在阅读界面，点击左侧边栏的“目录”标签
2. 点击任意章节即可跳转

### 批注功能

1. 选中要批注的文本
2. 右键点击选中的文本
3. 选择“添加批注”或“摘抄”
4. 输入批注内容并保存

### 切换阅读模式

- **翻页模式**：传统书籍翻页效果
- **滚动模式**：连续滚动阅读
- 在工具栏中点击模式切换按钮

---

## 📁 项目结构

```
rosa/
├── electron/              # Electron 主进程代码
│   ├── main.js           # 主进程入口
│   └── preload.js        # 预加载脚本
├── src/                  # Vue 前端源码
│   ├── components/       # Vue 组件
│   │   ├── Library.vue   # 书架组件
│   │   └── Reader.vue    # 阅读器组件
│   ├── stores/           # Pinia 状态管理
│   │   └── bookStore.js  # 书籍状态管理
│   ├── App.vue           # 根组件
│   ├── main.js           # Vue 入口文件
│   └── style.css         # 全局样式
├── public/               # 静态资源
│   ├── logo.svg          # 应用 Logo
│   └── icon.png          # PNG 图标（待转换为 ICO）
├── build-windows.ps1     # PowerShell 打包脚本
├── build-windows.bat     # 批处理打包脚本
├── convert-icon.bat      # 图标转换辅助脚本
├── index.html            # HTML 模板
├── package.json          # 项目配置
├── vite.config.js        # Vite 配置
└── README.md             # 项目说明
```

---

## 🎨 Logo 与图标

### Logo 设计说明

Logo 采用简洁现代的设计风格，包含以下元素：

1. **蓝色圆形背景** - 代表知识和智慧
2. **打开的书本** - 象征阅读和学习
3. **书页细节** - 体现内容的丰富性
4. **装饰圆点** - 增加视觉趣味性

**颜色方案**:
- 主色调: #4A90E2 (蓝色渐变)
- 辅助色: #FFFFFF (白色书页)
- 强调色: #357ABD (深蓝色)

### Logo 应用位置

- ✅ 书架页面顶部（48x48px）
- ✅ 阅读器工具栏（32x32px）
- ⏳ Electron 窗口图标（需要 ICO 格式）

### 转换为 ICO 格式

Windows 应用需要 `.ico` 格式的图标文件。

#### 快速转换方法

双击运行 `convert-icon.bat`，它会自动打开在线转换网站并显示操作步骤。

或手动操作：

1. **访问**: https://convertio.co/zh/png-ico/
2. **上传**: `public/icon.png`
3. **转换**: 点击转换按钮
4. **下载**: 保存为 `icon.ico`
5. **放置**: 将文件保存到 `public/` 目录

#### 其他在线工具

- [CloudConvert](https://cloudconvert.com/png-to-ico)
- [FreeConvert](https://www.freeconvert.com/png-to-ico)

### 验证图标

创建 `icon.ico` 后重新打包，检查以下位置是否使用了新图标：

- ✅ 桌面快捷方式
- ✅ 任务栏图标
- ✅ Alt+Tab 切换窗口
- ✅ 安装程序图标
- ✅ 应用窗口标题栏

---

## 💡 提示

- 阅读进度会自动保存，下次打开同一本书时会从上次的位置继续
- 数据库文件存储在用户数据目录中（Windows: `%APPDATA%/epub_reader.db`）
- 支持键盘快捷键：左右箭头键可以快速翻页

---

## 📦 打包部署

### 打包脚本说明

本项目提供了两个打包脚本，用于将应用打包为 Windows 桌面软件安装包。

#### 脚本文件

1. **build-windows.ps1** - PowerShell 脚本（推荐）
   - 更友好的输出和错误提示
   - 支持彩色显示
   - 自动检测环境

2. **build-windows.bat** - 批处理脚本
   - 兼容性好，适用于所有 Windows 系统
   - 简单的命令行界面

### 打包流程

脚本会自动执行以下步骤：

1. ✅ **检查环境** - 验证 Node.js 和 npm 是否安装
2. ✅ **清理旧文件** - 删除之前的构建产物
3. ✅ **安装依赖** - 如果需要，自动安装 npm 包
4. ✅ **构建前端** - 使用 Vite 构建 Vue 应用
5. ✅ **打包 Electron** - 使用 electron-builder 创建安装包

### 输出文件

打包成功后，会在 `dist-electron` 目录生成以下文件：

- **EPUB Reader Setup 1.0.0.exe** - Windows 安装程序（约 87 MB）
- **EPUB Reader Setup 1.0.0.exe.blockmap** - 增量更新文件
- **win-unpacked/** - 未打包的应用程序文件夹

### 配置说明

#### 环境变量

脚本会自动设置以下环境变量：

- `msvs_version=2022` - 指定 Visual Studio 版本用于编译原生模块
- `npm_config_electron_mirror` - 使用淘宝镜像加速 Electron 下载

#### 配置文件

打包配置位于 `package.json` 的 `build` 字段：

```json
{
  "build": {
    "appId": "com.epubreader.app",
    "productName": "EPUB Reader",
    "directories": {
      "output": "dist-electron"
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "EPUB Reader"
    }
  }
}
```

### 版本更新

修改版本号：

1. 编辑 `package.json`
2. 修改 `version` 字段
3. 重新运行打包脚本

```json
{
  "name": "epub-reader",
  "version": "1.0.1",  // 修改这里
  ...
}
```

### 最佳实践

1. **每次打包前**：
   - 确保代码已提交到版本控制
   - 关闭所有应用实例
   - 清理 node_modules（如有必要）

2. **测试安装包**：
   - 在干净的 Windows 环境中测试
   - 验证所有功能正常工作
   - 检查数据库和文件存储

3. **分发安装包**：
   - 提供 SHA256 校验和
   - 包含安装说明文档
   - 注明系统要求（Windows 10/11 x64）

---

## 🐛 常见问题

### Node.js 版本问题

如果遇到安装错误，请确保使用 Node.js 18 或更高版本。可以使用 nvm 管理多个 Node.js 版本：

```bash
nvm install 18
nvm use 18
```

### 依赖安装失败

如果 `npm install` 失败，可以尝试：

```bash
npm install --ignore-scripts
```

### better-sqlite3 编译错误

**原因**: Visual Studio 版本不匹配

**解决**: 确保已安装 Visual Studio 2022 Build Tools，并设置 `msvs_version=2022`

### 打包失败：无法下载 Electron

**原因**: GitHub 访问缓慢

**解决**: 脚本已自动配置淘宝镜像，如果仍有问题，检查网络连接

### 打包失败：文件被占用

**原因**: 之前的应用实例仍在运行

**解决**: 
- 关闭所有 EPUB Reader 窗口
- 在任务管理器中结束相关进程
- 重新运行打包脚本

### 安装后无法打开

**可能原因**:
- 数据库路径配置错误
- 文件权限问题

**解决**: 
- 检查用户数据目录是否有写入权限
- 查看控制台日志排查具体错误

---

## 💻 开发指南

### 代码规范

- 使用 Vue 3 Composition API
- 组件命名采用 PascalCase
- 变量和函数命名采用 camelCase
- 常量命名采用 UPPER_SNAKE_CASE

### 调试技巧

#### 开发环境

```bash
# 启动开发模式
npm run electron:dev

# 查看控制台日志
# - 前端日志：Vite 开发服务器控制台
# - 后端日志：Electron 主进程控制台
```

#### 生产环境

```bash
# 打包后测试
npm run electron:build

# 运行安装包
# dist-electron\EPUB Reader Setup 1.0.0.exe
```

### 关键日志保留

以下日志被保留用于生产环境调试：

**Reader.vue**:
- ✅ 阅读器初始化日志
- ✅ 右键菜单设置和触发日志
- ✅ iframe 监听器重试机制
- ✅ 所有错误和警告日志

**Library.vue**:
- ✅ 错误日志（console.error）
- ✅ 应用路径加载状态

**electron/main.js**:
- ✅ 应用启动日志
- ✅ 窗口创建日志
- ✅ 数据库初始化日志
- ✅ IPC 处理器日志

**electron/preload.js**:
- ✅ 所有 Preload 日志 - IPC 通信调试

### 清理原则

1. **删除**：开发阶段的详细调试信息
2. **保留**：错误处理和关键流程日志
3. **保留**：用户可见的错误提示
4. **保留**：性能相关的警告

---

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

---

**最后更新**: 2026-05-26

享受阅读吧！📚✨
