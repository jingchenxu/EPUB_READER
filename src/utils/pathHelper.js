/**
 * 文件路径处理工具
 * 用于处理 Electron 应用中的文件路径，兼容开发和生产环境
 */

/**
 * 将相对路径转换为完整的 file:// URL
 * @param {string} relativePath - 相对路径（如 'upload/covers/cover_xxx.jpg'）
 * @param {string} userDataPath - 用户数据目录路径
 * @param {string} appPath - 应用路径（开发环境使用）
 * @returns {string} 完整的 file:// URL
 */
export function buildFileUrl(relativePath, userDataPath, appPath) {
  if (!relativePath) {
    return ''
  }

  // 标准化路径分隔符
  const normalizedPath = relativePath.replace(/\\/g, '/')

  // 检查是否是生产环境（打包后）
  const isProduction = appPath && (appPath.includes('resources') && appPath.includes('app.asar'))

  let absolutePath

  if (isProduction) {
    // 生产环境：使用用户数据目录
    // userDataPath: C:\Users\xxx\AppData\Roaming\epub-reader
    // relativePath: upload/covers/cover_xxx.jpg
    absolutePath = `${userDataPath}/${normalizedPath}`
  } else {
    // 开发环境：封面和书籍文件也保存在 userDataPath 中
    // 因为主进程中 extractEpubMetadata 使用 app.getPath('userData') 保存文件
    absolutePath = `${userDataPath}/${normalizedPath}`
  }

  // 转换为 file:// URL
  // Windows: file:///C:/Users/...
  // Unix: file:///home/...
  const fileUrl = `file:///${absolutePath}`

  return fileUrl
}

/**
 * 检查路径是否有效
 * @param {string} url - 文件 URL
 * @returns {boolean}
 */
export function isValidFileUrl(url) {
  return url && url.startsWith('file:///')
}
