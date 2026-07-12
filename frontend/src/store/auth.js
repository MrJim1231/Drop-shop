const TOKEN_KEY = 'token'
const USER_ID_KEY = 'userId'

export const authStore = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  getUserId() {
    return localStorage.getItem(USER_ID_KEY)
  },

  isLoggedIn() {
    return !!this.getToken()
  },

  login(token, userId) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_ID_KEY, userId)
    window.dispatchEvent(new CustomEvent('auth-updated'))
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY)
    window.dispatchEvent(new CustomEvent('auth-updated'))
  },

  setUserId(userId) {
    localStorage.setItem(USER_ID_KEY, userId)
  },
}
