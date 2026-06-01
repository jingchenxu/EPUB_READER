/**
 * HTTP 请求工具函数
 * 自动在请求头中添加认证 token
 */

/**
 * 获取存储的 auth token
 */
export function getAuthToken() {
  return localStorage.getItem('auth_token')
}

/**
 * 创建带有认证头的 fetch 请求配置
 * @param {Object} options - fetch 选项
 * @returns {Object} - 包含认证头的配置对象
 */
export function createAuthHeaders(options = {}) {
  const token = getAuthToken()
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  // 如果有 token，添加到请求头
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return {
    ...options,
    headers
  }
}

/**
 * 带认证的 fetch 请求封装
 * @param {string} url - 请求 URL
 * @param {Object} options - fetch 选项
 * @returns {Promise<Response>} - fetch 响应
 */
export async function authFetch(url, options = {}) {
  const authOptions = createAuthHeaders(options)
  return fetch(url, authOptions)
}
