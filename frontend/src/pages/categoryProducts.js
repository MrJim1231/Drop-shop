import { api } from '../api/client.js'
import { productCard, loadingSpinner, escapeHtml } from '../utils.js'

export async function renderCategoryProducts(categoryId) {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'

  container.innerHTML = `
    <nav class="text-sm text-slate-500 mb-6">
      <a href="#/" class="hover:text-indigo-600">Головна</a>
      <span class="mx-2">/</span>
      <a href="#/categories" class="hover:text-indigo-600">Каталог</a>
      <span class="mx-2">/</span>
      <span id="breadcrumb-name" class="text-slate-800">...</span>
    </nav>
    <div id="category-header" class="mb-8">${loadingSpinner()}</div>
    <div id="category-products">${loadingSpinner()}</div>`

  try {
    const [category, products] = await Promise.all([
      api.getCategory(categoryId),
      api.getProductsByCategory(categoryId),
    ])

    container.querySelector('#breadcrumb-name').textContent = category.name

    container.querySelector('#category-header').innerHTML = `
      <h1 class="text-3xl font-bold text-slate-800">${escapeHtml(category.name)}</h1>
      <p class="text-slate-500 mt-2">${products.length} товарів</p>`

    const productsEl = container.querySelector('#category-products')

    if (!products.length) {
      productsEl.innerHTML = `<p class="text-center text-slate-500 py-16">У цій категорії поки немає товарів</p>`
      return container
    }

    productsEl.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      ${products.map((p) => productCard(p)).join('')}
    </div>`
  } catch {
    container.innerHTML = `
      <div class="text-center py-16">
        <p class="text-slate-500 mb-4">Категорію не знайдено або помилка завантаження</p>
        <a href="#/categories" class="text-indigo-600 hover:text-indigo-700 font-medium">← Повернутись до каталогу</a>
      </div>`
  }

  return container
}
