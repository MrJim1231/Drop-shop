const TOKEN_KEY = 'token'
const USER_ID_KEY = 'userId'
const ADMIN_KEY = 'isAdmin'

export const authStore = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  getUserId() {
    return localStorage.getItem(USER_ID_KEY)
  },

  isAdmin() {
    return localStorage.getItem(ADMIN_KEY) === 'true'
  },

  isLoggedIn() {
    return !!this.getToken()
  },

  login(token, userId, isAdmin = false) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_ID_KEY, userId)
    localStorage.setItem(ADMIN_KEY, isAdmin ? 'true' : 'false')
    window.dispatchEvent(new CustomEvent('auth-updated'))
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(ADMIN_KEY)
    window.dispatchEvent(new CustomEvent('auth-updated'))
  },

  setUserId(userId) {
    localStorage.setItem(USER_ID_KEY, userId)
  },
}
