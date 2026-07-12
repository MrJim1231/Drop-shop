import { api } from '../api/client.js'

const CART_KEY = 'cart'
const USER_ID_KEY = 'userId'

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || []
  } catch {
    return []
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('cart-updated'))
}

export const cartStore = {
  getItems() {
    return loadCart()
  },

  getCount() {
    return loadCart().reduce((sum, item) => sum + item.quantity, 0)
  },

  getTotal() {
    return loadCart().reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  addItem(product) {
    const items = loadCart()
    const existing = items.find((i) => i.id === product.id)

    if (existing) {
      existing.quantity += product.quantity || 1
    } else {
      items.push({
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.image || (product.images && product.images[0]) || '',
        size: product.size || '—',
        quantity: product.quantity || 1,
        rubber: product.rubber || false,
      })
    }

    saveCart(items)
  },

  updateQuantity(id, quantity) {
    const items = loadCart()
    const item = items.find((i) => i.id === id)
    if (item) {
      item.quantity = Math.max(1, quantity)
      saveCart(items)
    }
  },

  removeItem(id) {
    saveCart(loadCart().filter((i) => i.id !== id))
  },

  clear() {
    saveCart([])
  },

  getUserId() {
    return localStorage.getItem(USER_ID_KEY)
  },

  setUserId(id) {
    localStorage.setItem(USER_ID_KEY, id)
  },

  async ensureUserId() {
    let userId = this.getUserId()
    if (!userId) {
      const data = await api.generateUserId()
      userId = data.userId
      this.setUserId(userId)
    }
    return userId
  },
}
