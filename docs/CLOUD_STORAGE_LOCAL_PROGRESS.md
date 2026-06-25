# 云端存储最后阅读"未阅读"问题修复

## 问题现象

云端存储页面中，所有书籍的"最后阅读"列均显示"未阅读"，即使本地已有阅读进度。

## 根因分析

`Library.vue` 的 `fetchCloudBooks` 函数存在两段逻辑：

1. **第 1119-1133 行**：快速路径，直接映射云端数据，`lastRead` 从云端 API 字段提取（`normalizeCloudLastRead`）
2. **第 1135-1178 行**：详细路径，用本地书籍的 `last_read_at` 和 `getProgress` 丰富阅读进度

问题在于第 1133 行有一个提前 `return`，导致第 1135 行之后的本地数据丰富逻辑成为**死代码**，从未被执行。云端 API 如果不返回 `lastRead` 相关字段，`normalizeCloudLastRead` 返回空字符串，模板显示"未阅读"。

## 修复方案

移除提前 `return`，在云端数据映射后遍历已有本地书籍但云端无 `lastRead` 的记录，从本地数据库补充阅读进度：

```javascript
// 对于云端未返回阅读进度的书籍，使用本地阅读进度补充
for (const cloudBook of cloudOnlyBooks) {
  if (cloudBook.lastRead) continue  // 已有云端数据，跳过
  const localBook = books.value.find(b => b.title === cloudBook.title)
  if (!localBook) continue

  try {
    if (localBook.last_read_at) {
      const dateStr = new Date(localBook.last_read_at).toLocaleString('zh-CN', {...})
      const progress = await window.electronAPI.getProgress(localBook.id)
      if (progress && progress.percentage > 0) {
        cloudBook.lastRead = `${dateStr} (${Math.round(progress.percentage * 100)}%)`
      } else {
        cloudBook.lastRead = dateStr
      }
    }
  } catch (e) {
    // fallback
  }
}
```

## 优先级

- 云端 API 有 `lastRead` → 直接使用
- 本地书籍有 `last_read_at` → 从本地数据库读取
- 都没有 → 显示"未阅读"

## 涉及文件

- `src/components/Library.vue` — `fetchCloudBooks` 函数
