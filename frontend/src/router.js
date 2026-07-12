import { renderHeader, bindHeaderEvents } from './components/header.js'
import { renderFooter } from './components/footer.js'
import { renderHome } from './pages/home.js'
import { renderCategories } from './pages/categories.js'
import { renderCategoryProducts } from './pages/categoryProducts.js'
import { renderProductDetail } from './pages/productDetail.js'
import { renderCart } from './pages/cart.js'
import { renderLogin } from './pages/login.js'
import { renderOrders } from './pages/orders.js'
import { renderProfile } from './pages/profile.js'
import { renderAdmin } from './pages/admin.js'

const routes = {
  '/': () => renderHome(),
  '/categories': () => renderCategories(),
  '/category/:id': (params) => renderCategoryProducts(params.id),
  '/product/:id': (params) => renderProductDetail(params.id),
  '/cart': () => renderCart(),
  '/login': () => renderLogin(),
  '/orders': () => renderOrders(),
  '/profile': () => renderProfile(),
  '/admin': () => renderAdmin(),
}

export function navigateTo(path) {
  window.history.pushState(null, '', path)
  navigate()
}

function parsePath() {
  const pathName = window.location.pathname || '/'
  const parts = pathName.split('/').filter(Boolean)

  if (parts.length === 0) return { path: '/', params: {} }

  if (parts[0] === 'category' && parts[1]) {
    return { path: '/category/:id', params: { id: parts[1] } }
  }
  if (parts[0] === 'product' && parts[1]) {
    return { path: '/product/:id', params: { id: parts[1] } }
  }

  const path = '/' + parts[0]
  return { path, params: {} }
}

let isNavigating = false

export async function navigate() {
  if (isNavigating) return
  isNavigating = true

  const app = document.getElementById('app')
  const { path, params } = parsePath()
  const handler = routes[path]

  app.innerHTML = `
    ${renderHeader()}
    <main id="main-content" class="flex-1">
      <div class="flex justify-center py-16">
        <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    </main>
    ${renderFooter()}`

  bindHeaderEvents()

  try {
    const content = handler ? await handler(params) : notFoundPage()
    const main = document.getElementById('main-content')
    main.innerHTML = ''
    main.appendChild(content)
  } catch (err) {
    console.error('Navigation error:', err)
    document.getElementById('main-content').innerHTML =
      `<div class="text-center py-16 text-slate-500">Помилка завантаження сторінки</div>`
  }

  isNavigating = false
  window.scrollTo(0, 0)
}

function notFoundPage() {
  const div = document.createElement('div')
  div.className = 'text-center py-20'
  div.innerHTML = `
    <h1 class="text-4xl font-bold text-slate-800">404</h1>
    <p class="text-slate-500 mt-2 mb-8">Сторінку не знайдено</p>
    <a href="/" class="text-indigo-600 hover:text-indigo-700 font-medium">На головну</a>`
  return div
}

export function initRouter() {
  window.addEventListener('popstate', navigate)
  window.addEventListener('cart-updated', navigate)
  window.addEventListener('auth-updated', navigate)

  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('a')
    if (link) {
      const href = link.getAttribute('href')
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault()
        navigateTo(href)
      }
    }
  })

  navigate()
}
