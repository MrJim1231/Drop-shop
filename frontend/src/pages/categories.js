import { api } from '../api/client.js'
import { escapeHtml, loadingSpinner } from '../utils.js'

export async function renderCategories() {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'

  container.innerHTML = `
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-slate-800">Каталог товарів</h1>
      <p class="text-slate-500 mt-2">Оберіть категорію для перегляду товарів</p>
    </div>
    <div id="categories-grid">${loadingSpinner()}</div>`

  try {
    const categories = await api.getCategories()
    const grid = container.querySelector('#categories-grid')

    if (!categories.length) {
      grid.innerHTML = `<p class="text-center text-slate-500 py-16">Категорії не знайдено. Запустіть імпорт товарів на бекенді.</p>`
      return container
    }

    grid.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      ${categories.map((cat) => `
        <a href="#/category/${cat.id}" class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
          <div class="aspect-[4/3] bg-slate-100 overflow-hidden">
            <img src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"
              onerror="this.src='https://placehold.co/400x300/f1f5f9/94a3b8?text=${encodeURIComponent(cat.name)}'" />
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">${escapeHtml(cat.name)}</h3>
          </div>
        </a>
      `).join('')}
    </div>`
  } catch {
    container.querySelector('#categories-grid').innerHTML =
      `<div class="text-center py-16">
        <p class="text-slate-500 mb-4">Не вдалося завантажити категорії</p>
        <p class="text-sm text-slate-400">Переконайтесь, що бекенд запущений: <code class="bg-slate-100 px-2 py-1 rounded">http://localhost/course__udemy/backend/api/</code></p>
      </div>`
  }

  return container
}
