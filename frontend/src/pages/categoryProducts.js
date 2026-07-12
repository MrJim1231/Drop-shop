import { api } from '../api/client.js'
import { productCard, loadingSpinner, escapeHtml } from '../utils.js'

export async function renderCategoryProducts(categoryId) {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'

  container.innerHTML = `
    <nav class="text-sm text-slate-500 mb-6" id="breadcrumb">
      <a href="#/" class="hover:text-indigo-600">Головна</a>
      <span class="mx-2">/</span>
      <a href="#/categories" class="hover:text-indigo-600">Каталог</a>
      <span class="mx-2">/</span>
      <span id="breadcrumb-name" class="text-slate-800">...</span>
    </nav>
    <div id="category-header" class="mb-8">${loadingSpinner()}</div>
    <div id="category-content">${loadingSpinner()}</div>`

  try {
    const category = await api.getCategory(categoryId)
    const subcategories = category.subcategories || []

    container.querySelector('#breadcrumb-name').textContent = category.name

    if (category.parent_category) {
      const breadcrumb = container.querySelector('#breadcrumb')
      const parentLink = document.createElement('span')
      parentLink.innerHTML = `
        <span class="mx-2">/</span>
        <a href="#/category/${category.parent_category.id}" class="hover:text-indigo-600">${escapeHtml(category.parent_category.name)}</a>`
      breadcrumb.insertBefore(parentLink, container.querySelector('#breadcrumb-name'))
    }

    container.querySelector('#category-header').innerHTML = `
      <h1 class="text-3xl font-bold text-slate-800">${escapeHtml(category.name)}</h1>`

    const contentEl = container.querySelector('#category-content')

    if (subcategories.length > 0) {
      contentEl.innerHTML = `
        <p class="text-slate-500 mb-6">Оберіть підкатегорію</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          ${subcategories.map((cat) => `
            <a href="#/category/${cat.id}" class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all">
              <div class="aspect-[4/3] bg-slate-100 overflow-hidden">
                <img src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
              <div class="p-4">
                <h3 class="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">${escapeHtml(cat.name)}</h3>
              </div>
            </a>
          `).join('')}
        </div>`
      return container
    }

    const products = await api.getProductsByCategory(categoryId)

    container.querySelector('#category-header').innerHTML += `
      <p class="text-slate-500 mt-2">${products.length} товарів</p>`

    if (!products.length) {
      contentEl.innerHTML = `<p class="text-center text-slate-500 py-16">У цій категорії поки немає товарів</p>`
      return container
    }

    contentEl.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
