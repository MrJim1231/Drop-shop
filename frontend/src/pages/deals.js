import { api } from '../api/client.js'
import { productCard, loadingSpinner } from '../utils.js'

export async function renderDeals() {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'

  container.innerHTML = `
    <div class="mb-10 text-center md:text-left">
      <span class="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-rose-50 text-rose-600 mb-4 uppercase tracking-widest border border-rose-100/60">🔥 Гарячі пропозиції</span>
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">Акційні товари</h1>
      <p class="text-base sm:text-lg text-slate-500 font-medium">Купуйте найкращі гаджети та аксесуари за суперцінами зі знижкою до -50%</p>
    </div>
    <div id="deals-content">${loadingSpinner()}</div>`

  const contentEl = container.querySelector('#deals-content')

  try {
    const res = await api.getDiscountedProducts()
    const products = res.products || []

    if (!products.length) {
      contentEl.innerHTML = `
        <div class="text-center py-20 bg-slate-50 border border-slate-200/60 rounded-[2.5rem] p-8 max-w-2xl mx-auto">
          <div class="text-6xl mb-6">🏷️</div>
          <h2 class="text-2xl font-bold text-slate-800 mb-2">Наразі немає активних акцій</h2>
          <p class="text-slate-500 font-normal mb-8">Завітайте пізніше або перегляньте наш каталог товарів, щоб знайти інші цікаві пропозиції.</p>
          <a href="/categories" class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">
            Перейти до каталогу
          </a>
        </div>`
      return container
    }

    // Since productCard expects discounted_price to be present for showing discount UI:
    contentEl.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        ${products.map((p) => productCard(p)).join('')}
      </div>`

  } catch (err) {
    contentEl.innerHTML = `<p class="text-center text-red-500 py-16">Помилка завантаження товарів: ${err.message}</p>`
  }

  return container
}
