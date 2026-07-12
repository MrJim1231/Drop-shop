import { api } from '../api/client.js'
import { productCard, loadingSpinner, escapeHtml } from '../utils.js'

export async function renderHome() {
  const container = document.createElement('div')
  container.className = 'page-enter'

  container.innerHTML = `
    <section class="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div class="max-w-2xl">
          <h1 class="text-4xl md:text-5xl font-bold leading-tight">Все, що потрібно — в одному місці</h1>
          <p class="mt-4 text-lg text-indigo-100">Понад 2000 товарів: електроніка, автоаксесуари, побутова техніка та багато іншого. Швидка доставка по Україні.</p>
          <div class="mt-8 flex flex-wrap gap-4">
            <a href="/categories" class="inline-flex items-center px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
              Переглянути каталог
            </a>
            <a href="/cart" class="inline-flex items-center px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
              Кошик
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-slate-800">Категорії</h2>
        <a href="/categories" class="text-sm font-medium text-indigo-600 hover:text-indigo-700">Всі категорії →</a>
      </div>
      <div id="home-categories">${loadingSpinner()}</div>
    </section>

    <section class="bg-white border-y border-slate-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 class="text-2xl font-bold text-slate-800 mb-8">Популярні товари</h2>
        <div id="home-products">${loadingSpinner()}</div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">🚚</div>
          <h3 class="font-semibold text-slate-800">Швидка доставка</h3>
          <p class="text-sm text-slate-500 mt-2">Відправляємо замовлення протягом 1–3 робочих днів</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">✅</div>
          <h3 class="font-semibold text-slate-800">Гарантія якості</h3>
          <p class="text-sm text-slate-500 mt-2">Тільки перевірені товари від надійних постачальників</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">💬</div>
          <h3 class="font-semibold text-slate-800">Підтримка 24/7</h3>
          <p class="text-sm text-slate-500 mt-2">Завжди на зв'язку для допомоги з замовленням</p>
        </div>
      </div>
    </section>`

  loadCategories(container)
  loadProducts(container)

  return container
}

async function loadCategories(container) {
  const el = container.querySelector('#home-categories')
  try {
    const categories = await api.getCategories()
    const top = categories.slice(0, 8)

    el.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      ${top.map((cat) => `
        <a href="/category/${cat.id}" class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all">
          <div class="aspect-[4/3] bg-slate-100 overflow-hidden">
            <img src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"
              onerror="this.src='https://placehold.co/400x300/f1f5f9/94a3b8?text=${encodeURIComponent(cat.name)}'" />
          </div>
          <p class="p-3 text-sm font-medium text-slate-700 text-center group-hover:text-indigo-600 transition-colors">${escapeHtml(cat.name)}</p>
        </a>
      `).join('')}
    </div>`
  } catch {
    el.innerHTML = `<p class="text-center text-slate-500 py-8">Не вдалося завантажити категорії. Перевірте підключення до бекенду.</p>`
  }
}

async function loadProducts(container) {
  const el = container.querySelector('#home-products')
  try {
    const data = await api.getProducts(1)
    const products = data.products?.slice(0, 8) || []

    if (products.length === 0) {
      el.innerHTML = `<p class="text-center text-slate-500 py-8">Товари ще не додані. Запустіть імпорт на бекенді.</p>`
      return
    }

    el.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      ${products.map((p) => productCard(p)).join('')}
    </div>`
  } catch {
    el.innerHTML = `<p class="text-center text-slate-500 py-8">Не вдалося завантажити товари.</p>`
  }
}
