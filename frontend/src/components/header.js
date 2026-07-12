import { cartStore } from '../store/cart.js'
import { authStore } from '../store/auth.js'
import { api } from '../api/client.js'
import { escapeHtml, slugify } from '../utils.js'

let categoriesCache = null

export function renderHeader() {
  const cartCount = cartStore.getCount()
  const isLoggedIn = authStore.isLoggedIn()

  return `
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <a href="/" class="flex items-center gap-2 group flex-shrink-0">
              <div class="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:bg-indigo-700 transition-colors">D</div>
              <span class="font-bold text-xl text-slate-800 hidden sm:block">DropShop</span>
            </a>

            <!-- Кнопка Каталог (як на Розетка) -->
            <button type="button" id="catalog-drawer-btn" class="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer">
              <span>☰</span>
              <span>Каталог</span>
            </button>
          </div>

          <!-- Пошук товарів (десктоп) -->
          <div class="flex-1 max-w-md mx-8 hidden md:block">
            <form id="search-form" class="relative">
              <input type="search" id="search-input" placeholder="Пошук товарів за назвою..."
                class="w-full pl-10 pr-4 py-2 bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm outline-none transition-all font-normal text-slate-700" />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </form>
          </div>

          <nav class="hidden md:flex items-center gap-6 flex-shrink-0">
            <a href="/" class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Головна</a>
            <a href="/categories" class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Каталог</a>
            ${isLoggedIn ? `
              <a href="/orders" class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Мої замовлення</a>
              <a href="/profile" class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Профіль</a>
              <a href="/admin" class="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors font-semibold">Адмінка</a>
            ` : ''}
          </nav>
 
          <div class="flex items-center gap-3 flex-shrink-0">
            ${isLoggedIn
              ? `<button id="logout-btn" class="text-sm text-slate-600 hover:text-red-600 transition-colors hidden sm:block">Вийти</button>`
              : `<a href="/login" class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">Увійти</a>`
            }
            <a href="/cart" class="relative p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Кошик">
              <svg class="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              ${cartCount > 0 ? `<span class="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">${cartCount}</span>` : ''}
            </a>
            <button id="mobile-menu-btn" class="md:hidden p-2 rounded-xl hover:bg-slate-100">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>

        <div id="mobile-menu" class="hidden md:hidden pb-4 border-t border-slate-100 pt-3">
          <!-- Пошук товарів (мобільний) -->
          <form id="mobile-search-form" class="relative mb-3 px-1">
            <input type="search" id="mobile-search-input" placeholder="Пошук товарів..."
              class="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm outline-none transition-all font-normal text-slate-700" />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </form>
          <nav class="flex flex-col gap-2">
            <a href="/" class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Головна</a>
            <a href="/categories" class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Каталог</a>
            ${isLoggedIn
              ? `<a href="/orders" class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Мої замовлення</a>
                 <a href="/profile" class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Профіль</a>
                 <a href="/admin" class="px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50">Адмінка</a>
                 <button id="mobile-logout-btn" class="px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 text-left">Вийти</button>`
              : `<a href="/login" class="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Увійти</a>`
            }
          </nav>
        </div>
      </div>
    </header>

    <!-- Висувний Сайдбар Каталогу (як на Розетка) -->
    <div id="catalog-drawer-overlay" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 hidden transition-opacity duration-300 opacity-0">
      <div id="catalog-drawer" class="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 transform -translate-x-full transition-transform duration-300 ease-in-out p-6 flex flex-col">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <h3 class="font-bold text-slate-800 text-lg">Каталог товарів</h3>
          <button type="button" id="close-drawer-btn" class="text-slate-400 hover:text-slate-600 text-2xl font-bold p-1 cursor-pointer">✕</button>
        </div>
        <div class="flex-1 overflow-y-auto pr-1" id="drawer-categories-list">
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
      <ul class="space-y-1">
        ${filtered.map((cat) => `
          <li>
            <a href="/category/${cat.id}-${slugify(cat.name)}" class="drawer-link flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all">
              <span>📁</span>
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
