/**
 * HTTP request helpers.
 * Adds auth headers and logs the user out when protected API calls fail.
 */

let logoutCallback = null
let isLoggingOut = false

export function setLogoutCallback(callback) {
  logoutCallback = callback
}

export function getAuthToken() {
  return localStorage.getItem('auth_token_full') || localStorage.getItem('auth_token')
}

function triggerLogout() {
  if (isLoggingOut || !getAuthToken()) return

  isLoggingOut = true
  try {
    if (logoutCallback) {
      logoutCallback()
    } else {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_token_full')
      localStorage.removeItem('username')
    }
  } finally {
    setTimeout(() => {
      isLoggingOut = false
    }, 0)
  }
}

export function createAuthHeaders(options = {}) {
  const token = getAuthToken()
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  const headers = {
    ...options.headers
  }

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  }

  return {
    ...options,
    headers
  }
}

export async function checkAuthError(response) {
  if (response.status === 401 || response.status === 403) {
    triggerLogout()
  }
}

export async function authFetch(url, options = {}) {
  const authOptions = createAuthHeaders(options)

  try {
    const response = await fetch(url, authOptions)
    await checkAuthError(response)

    if (response.status >= 500) {
      triggerLogout()
    }

    return response
  } catch (error) {
    triggerLogout()
    throw error
  }
}
