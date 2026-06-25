# epub-file:// 协议 403 Forbidden 修复记录

## 问题现象

所有书籍封面图片通过 `epub-file://` 协议加载时返回 403 (Forbidden)，控制台大量报错：

```
GET epub-file://c/Users/jingc/AppData/Roaming/epub-reader/upload/covers/cover_xxx.jpg 403 (Forbidden)
```

## 根因分析

1. 前端 `pathHelper.js` 的 `buildFileUrl` 生成 URL 格式为 `epub-file:///C:/Users/jingc/...`（三斜杠，空 host）
2. `epub-file` 在 `main.js` 中注册为 **standard scheme**（`registerSchemesAsPrivileged`）
3. Chromium 对 standard scheme 做 URL 规范化时，将路径中的 `C:` 解析为 host，URL 变成 `epub-file://c/Users/...`
4. 原协议处理器仅取 `requestUrl.pathname`（即 `/Users/jingc/...`），丢失了驱动器盘符
5. `path.resolve('Users/jingc/...')` 将其当作相对路径，拼接了 cwd，结果路径不在 `userDataPath` 范围内
6. `isPathInside` 校验失败，返回 403

## 修复方案

修改 `electron/main.js` 的 `registerLocalFileProtocol` 函数，检测 `requestUrl.hostname` 是否为单字母（Windows 驱动器盘符），如果是则还原完整路径：

```javascript
const host = requestUrl.hostname
const pathname = requestUrl.pathname.replace(/^\/+/, '')

let requestedPath
if (host && /^[a-zA-Z]$/.test(host)) {
  // Chromium 将 epub-file:///C:/Users/... 规范化为 epub-file://c/Users/...
  // 驱动器盘符被移到 host 中，需要还原
  requestedPath = decodeURIComponent(`${host}:/${pathname}`)
} else {
  requestedPath = decodeURIComponent(pathname)
}
```

## 涉及文件

- `electron/main.js` — `registerLocalFileProtocol` 函数
