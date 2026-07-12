import { cartStore } from '../store/cart.js'
import { authStore } from '../store/auth.js'
import { api } from '../api/client.js'
import { escapeHtml, slugify } from '../utils.js'

let categoriesCache = null

export function renderHeader() {
  const cartCount = cartStore.getCount()
  const isLoggedIn = authStore.isLoggedIn()

  const path = window.location.pathname
  const isHomeActive = path === '/'
  const isCatalogActive = path === '/categories' || path.startsWith('/category/') || path.startsWith('/product/')
  const isOrdersActive = path === '/orders'
  const isProfileActive = path === '/profile'
  const isAdminActive = path === '/admin'

  const navLink = (href, label, isActive) =>
    `<a href="${href}" class="relative text-sm font-medium px-1 py-1 transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}">${label}${isActive ? '<span class="absolute -bottom-3 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></span>' : ''}</a>`

  return `
    <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200/60">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-5">
            <a href="/" class="flex items-center gap-2.5 group flex-shrink-0">
              <div class="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-indigo-200/50 group-hover:shadow-indigo-300/60 group-hover:scale-105 transition-all duration-200">D</div>
              <span class="font-extrabold text-lg text-slate-900 hidden sm:block tracking-tight">Drop<span class="text-indigo-600">Shop</span></span>
            </a>

            <button type="button" id="catalog-drawer-btn" class="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer group">
              <svg class="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
              <span>Каталог</span>
            </button>
          </div>

          <!-- Search -->
          <div class="flex-1 max-w-md mx-6 hidden md:block">
            <form id="search-form" class="relative group">
              <input type="search" id="search-input" placeholder="Пошук товарів..."
                class="w-full pl-11 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 rounded-xl text-sm outline-none transition-all duration-200 text-slate-700 placeholder:text-slate-400" />
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg class="h-4.5 w-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </form>
          </div>

          <nav class="hidden md:flex items-center gap-6 flex-shrink-0">
            ${navLink('/', 'Головна', isHomeActive)}
            ${navLink('/categories', 'Каталог', isCatalogActive)}
            ${isLoggedIn ? `
              ${navLink('/orders', 'Замовлення', isOrdersActive)}
              ${navLink('/profile', 'Профіль', isProfileActive)}
              ${navLink('/admin', 'Адмінка', isAdminActive)}
            ` : ''}
          </nav>
 
          <div class="flex items-center gap-2 flex-shrink-0 ml-4">
            ${isLoggedIn
              ? `<button id="logout-btn" class="text-sm text-slate-400 hover:text-red-500 transition-colors hidden sm:block px-2 py-1">Вийти</button>`
              : `<a href="/login" class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hidden sm:block px-3 py-2 hover:bg-indigo-50 rounded-xl">Увійти</a>`
            }
            <a href="/cart" class="relative p-2.5 rounded-xl hover:bg-slate-100 transition-all duration-200 group" aria-label="Кошик">
              <svg class="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              ${cartCount > 0 ? `<span class="absolute top-1 right-1 bg-indigo-600 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold shadow-sm shadow-indigo-200">${cartCount}</span>` : ''}
            </a>
            <button id="mobile-menu-btn" class="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>

        <div id="mobile-menu" class="hidden md:hidden pb-4 border-t border-slate-100 pt-3">
          <form id="mobile-search-form" class="relative mb-3 px-1">
            <input type="search" id="mobile-search-input" placeholder="Пошук товарів..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm outline-none transition-all text-slate-700" />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </form>
          <nav class="flex flex-col gap-1">
            <a href="/" class="px-3 py-2 rounded-xl text-sm font-medium ${isHomeActive ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}">Головна</a>
            <a href="/categories" class="px-3 py-2 rounded-xl text-sm font-medium ${isCatalogActive ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}">Каталог</a>
            ${isLoggedIn
              ? `<a href="/orders" class="px-3 py-2 rounded-xl text-sm font-medium ${isOrdersActive ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}">Замовлення</a>
                 <a href="/profile" class="px-3 py-2 rounded-xl text-sm font-medium ${isProfileActive ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}">Профіль</a>
                 <a href="/admin" class="px-3 py-2 rounded-xl text-sm font-medium ${isAdminActive ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-indigo-600 hover:bg-indigo-50'}">Адмінка</a>
                 <button id="mobile-logout-btn" class="px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 text-left">Вийти</button>`
              : `<a href="/login" class="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Увійти</a>`
            }
          </nav>
        </div>
      </div>
    </header>

    <!-- Catalog Drawer -->
    <div id="catalog-drawer-overlay" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 hidden transition-opacity duration-300 opacity-0">
      <div id="catalog-drawer" class="fixed inset-y-0 left-0 w-80 bg-white z-50 transform -translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
        <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 class="font-bold text-slate-900 text-base">Каталог товарів</h3>
          <button type="button" id="close-drawer-btn" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-4" id="drawer-categories-list">
          <div class="flex justify-center py-12">
            <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    </div>`
}

export function bindHeaderEvents() {
  const overlay = document.getElementById('catalog-drawer-overlay')
  const drawer = document.getElementById('catalog-drawer')
  const drawerBtn = document.getElementById('catalog-drawer-btn')
  const closeBtn = document.getElementById('close-drawer-btn')
  const categoriesListEl = document.getElementById('drawer-categories-list')

  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden')
  })

  // Open Drawer logic
  const openDrawer = async () => {
    if (!overlay || !drawer) return

    overlay.classList.remove('hidden')
    // Wait a tick for CSS displays to apply, then transition opacity & transform
    setTimeout(() => {
      overlay.classList.remove('opacity-0')
      overlay.classList.add('opacity-100')
      drawer.classList.remove('-translate-x-full')
      drawer.classList.add('translate-x-0')
    }, 10)

    // Load categories from API if not cached
    if (!categoriesCache && categoriesListEl) {
      try {
        const categories = await api.getCategories()
        categoriesCache = categories
        renderDrawerCategories(categories)
      } catch (err) {
        categoriesListEl.innerHTML = `<p class="text-xs text-slate-400 font-normal">Помилка завантаження категорій</p>`
      }
    } else if (categoriesCache) {
      renderDrawerCategories(categoriesCache)
    }
  }

  // Close Drawer logic
  const closeDrawer = () => {
    if (!overlay || !drawer) return

    overlay.classList.remove('opacity-100')
    overlay.classList.add('opacity-0')
    drawer.classList.remove('translate-x-0')
    drawer.classList.add('-translate-x-full')

    // Wait for animation to finish before adding hidden class
    setTimeout(() => {
      overlay.classList.add('hidden')
    }, 300)
  }

  function renderDrawerCategories(categories) {
    if (!categoriesListEl) return
    
    const rootIds = [1000001, 1000002, 1000003, 1000004, 1000005, 1000006, 1000007, 1000008, 1000009, 1000010, 1000011, 1000012, 1000013, 1000014, 1000015, 1000016, 1000017, 1000018, 1000019, 1000020]
    let filtered = categories.filter(c => rootIds.includes(Number(c.id)))
    if (filtered.length === 0) {
      filtered = categories
    }

    categoriesListEl.innerHTML = `
      <ul class="space-y-0.5">
        ${filtered.map((cat) => `
          <li>
            <a href="/category/${cat.id}-${slugify(cat.name)}" class="drawer-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all duration-150">
              <span class="text-base">📁</span>
              <span class="truncate">${escapeHtml(cat.name)}</span>
            </a>
          </li>
        `).join('')}
      </ul>`

    // Bind link click to close drawer
    categoriesListEl.querySelectorAll('.drawer-link').forEach(link => {
      link.addEventListener('click', closeDrawer)
    })
  }

  drawerBtn?.addEventListener('click', openDrawer)
  closeBtn?.addEventListener('click', closeDrawer)
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeDrawer()
  })

  const logout = () => {
    authStore.logout()
    window.history.pushState(null, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  document.getElementById('logout-btn')?.addEventListener('click', logout)
  document.getElementById('mobile-logout-btn')?.addEventListener('click', logout)

  const handleSearch = (inputVal) => {
    const query = inputVal.trim()
    if (query) {
      window.history.pushState(null, '', `/search?q=${encodeURIComponent(query)}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  document.getElementById('search-form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    handleSearch(document.getElementById('search-input')?.value || '')
  })

  document.getElementById('mobile-search-form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    handleSearch(document.getElementById('mobile-search-input')?.value || '')
    document.getElementById('mobile-menu')?.classList.add('hidden')
  })

  // Pre-fill inputs if search query is present in URL
  const searchParams = new URLSearchParams(window.location.search)
  const q = searchParams.get('q') || ''
  if (window.location.pathname === '/search' && q) {
    const desktopInput = document.getElementById('search-input')
    const mobileInput = document.getElementById('mobile-search-input')
    if (desktopInput) desktopInput.value = q
    if (mobileInput) mobileInput.value = q
  }
}
