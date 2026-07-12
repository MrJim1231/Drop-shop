import { API_URL } from './config.js'

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`
  const headers = { 'Content-Type': 'application/json', ...options.headers }

  const token = localStorage.getItem('token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, { ...options, headers })
  const text = await response.text()

  let data
  try {
    data = JSON.parse(text)
  } catch {
    const jsonStart = text.indexOf('{')
    const arrayStart = text.indexOf('[')
    const start = jsonStart === -1 ? arrayStart : arrayStart === -1 ? jsonStart : Math.min(jsonStart, arrayStart)
    if (start === -1) {
      throw new Error('Помилка сервера')
    }
    data = JSON.parse(text.slice(start))
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP ${response.status}`)
  }

  if (data && typeof data === 'object' && data.status === 'error') {
    throw new Error(data.message || 'Помилка API')
  }

  return data
}

export const api = {
  getCategories: () => request('categories.php'),

  getCategory: (id) => request(`get_category_by_id.php?category_id=${id}`),

  getProductsByCategory: (categoryId) =>
    request(`get_products_by_category.php?category_id=${categoryId}`),

  getProducts: (page = 1) => request(`products.php?page=${page}`),

  getProduct: (id) => request(`product-details.php?id=${id}`),

  createOrder: (data) =>
    request('order.php', { method: 'POST', body: JSON.stringify(data) }),

  generateUserId: () => request('order.php?generate_user_id=1'),

  login: (email, password) =>
    request('login.php', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (email, password, userId) =>
    request('register.php', {
      method: 'POST',
      body: JSON.stringify({ email, password, userId }),
    }),

  verifyEmail: (email, code) =>
    request('verify_email.php', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  getOrders: (userId) => request(`get_orders.php?userId=${userId}`),
}
