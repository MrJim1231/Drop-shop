import { cartStore } from '../store/cart.js'
import { authStore } from '../store/auth.js'

export function renderHeader() {
  const cartCount = cartStore.getCount()
  const isLoggedIn = authStore.isLoggedIn()

  return `
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <a href="/" class="flex items-center gap-2 group flex-shrink-0">
            <div class="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:bg-indigo-700 transition-colors">D</div>
            <span class="font-bold text-xl text-slate-800 hidden sm:block">DropShop</span>
          </a>

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
    </header>`
}

export function bindHeaderEvents() {
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden')
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
