# 🔧 图标转换指南

## 问题说明

当前的 `public/logo.ico` 文件尺寸太小（只有小尺寸），electron-builder 要求至少包含 256x256 尺寸的图标。

## 解决方案

### 方法一：使用在线工具转换（推荐）✨

1. **访问网站**: https://convertio.co/zh/png-ico/

2. **上传文件**: 
   - 选择项目中的 `public/logo-256.png` 文件

3. **设置选项**（如果可用）:
   - 选择"多尺寸"或"All sizes"
   - 确保包含 256x256 尺寸

4. **点击"转换"**

5. **下载文件**: 
   - 下载生成的 `logo.ico` 文件

6. **替换文件**:
   - 将下载的 `logo.ico` 保存到项目的 `public/` 目录
   - 覆盖现有的 `public/logo.ico`

7. **更新配置**:
   - 打开 `package.json`
   - 将第 71 行的 `"icon": "public/logo-256.png"` 改为 `"icon": "public/logo.ico"`
   - 打开 `electron/main.js`
   - 将第 235 行和第 486 行的 `logo-256.png` 改为 `logo.ico`

8. **重新打包**:
   ```bash
   npm run electron:build
   ```

### 方法二：使用其他在线工具

- [CloudConvert](https://cloudconvert.com/png-to-ico)
- [FreeConvert](https://www.freeconvert.com/png-to-ico)
- [ICO Convert](https://icoconvert.com/)

步骤类似，都是上传 PNG，下载 ICO。

### 方法三：继续使用 PNG（当前方案）

electron-builder 完全支持 PNG 格式作为图标，当前的配置应该可以正常工作。

**优点**:
- ✅ 无需转换
- ✅ 跨平台兼容性好
- ✅ electron-builder 自动处理

**缺点**:
- ⚠️ 某些 Windows 系统可能显示效果略差于 ICO

## 验证图标

打包完成后，检查以下位置的图标：

1. ✅ 安装包文件图标（`.exe` 文件）
2. ✅ 安装向导图标
3. ✅ 桌面快捷方式图标
4. ✅ 开始菜单图标
5. ✅ 任务栏图标
6. ✅ Alt+Tab 切换窗口图标
7. ✅ 应用窗口标题栏图标

## 当前状态

- ✅ `public/logo-256.png` - 256x256 PNG，已生成
- ⚠️ `public/logo.ico` - 尺寸不足，需要重新转换
- ✅ 当前配置使用 PNG，可以正常打包

## 快速操作

如果你想立即修复，请：

1. 访问 https://convertio.co/zh/png-ico/
2. 上传 `public/logo-256.png`
3. 下载并保存为 `public/logo.ico`
4. 运行以下命令更新配置：

```powershell
# 更新 package.json
# 将 "icon": "public/logo-256.png" 改为 "icon": "public/logo.ico"

# 更新 electron/main.js (两处)
# 将 logo-256.png 改为 logo.ico

# 重新打包
npm run electron:build
```

---

**提示**: 如果当前 PNG 图标显示效果可以接受，也可以不转换，直接使用 PNG 即可。
