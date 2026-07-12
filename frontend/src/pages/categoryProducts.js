import { api } from '../api/client.js'
import { productCard, loadingSpinner, escapeHtml } from '../utils.js'

const PAGE_SIZE = 16

export async function renderCategoryProducts(categoryId) {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'

  container.innerHTML = `
    <nav class="text-sm text-slate-500 mb-6" id="breadcrumb">
      <a href="/" class="hover:text-indigo-600">Головна</a>
      <span class="mx-2">/</span>
      <a href="/categories" class="hover:text-indigo-600">Каталог</a>
      <span class="mx-2">/</span>
      <span id="breadcrumb-name" class="text-slate-800">...</span>
    </nav>
    <div id="category-header" class="mb-8">${loadingSpinner()}</div>
    <div id="category-content">${loadingSpinner()}</div>
    <div id="products-pagination-container" class="mt-8"></div>`

  try {
    const category = await api.getCategory(categoryId)
    const subcategories = category.subcategories || []

    container.querySelector('#breadcrumb-name').textContent = category.name

    if (category.parent_category) {
      const breadcrumb = container.querySelector('#breadcrumb')
      const parentLink = document.createElement('span')
      parentLink.innerHTML = `
        <span class="mx-2">/</span>
        <a href="/category/${category.parent_category.id}" class="hover:text-indigo-600">${escapeHtml(category.parent_category.name)}</a>`
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
            <a href="/category/${cat.id}" class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all">
              <div class="aspect-[4/3] bg-slate-100 overflow-hidden">
                <img src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
              <div class="p-4">
                <h3 class="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">${escapeHtml(cat.name)}</h3>
              </div>
            </a>
          `).join('')}
        </div>`
      container.querySelector('#products-pagination-container').innerHTML = ''
      return container
    }

    const products = await api.getProductsByCategory(categoryId)

    if (!products.length) {
      contentEl.innerHTML = `<p class="text-center text-slate-500 py-16">У цій категорії поки немає товарів</p>`
      container.querySelector('#category-header').innerHTML += `
        <p class="text-slate-500 mt-2">0 товарів</p>`
      container.querySelector('#products-pagination-container').innerHTML = ''
      return container
    }

    const total = products.length
    const totalPages = Math.ceil(total / PAGE_SIZE)

    // Add count label under the title
    const headerCount = document.createElement('p')
    headerCount.className = 'text-slate-500 mt-2'
    headerCount.textContent = `${total} товарів`
    container.querySelector('#category-header').appendChild(headerCount)

    function renderProductsPage(page) {
      if (page < 1) page = 1
      if (page > totalPages) page = totalPages

      const start = (page - 1) * PAGE_SIZE
      const end = start + PAGE_SIZE
      const pageProducts = products.slice(start, end)

      contentEl.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        ${pageProducts.map((p) => productCard(p)).join('')}
      </div>`

      const paginationContainer = container.querySelector('#products-pagination-container')
      
      if (totalPages <= 1) {
        paginationContainer.innerHTML = ''
        return
      }

      // Generate page number sequence with ellipses
      let pageNumbers = []
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
          pageNumbers.push(i)
        } else if (pageNumbers[pageNumbers.length - 1] !== '...') {
          pageNumbers.push('...')
        }
      }

      paginationContainer.innerHTML = `
        <div class="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-4 sm:px-6 rounded-2xl shadow-sm border mt-8">
          <!-- Mobile pagination -->
          <div class="flex flex-1 justify-between sm:hidden">
            <button type="button" id="prev-prod-page-mobile" ${page === 1 ? 'disabled' : ''}
              class="relative inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
              Назад
            </button>
            <button type="button" id="next-prod-page-mobile" ${page === totalPages ? 'disabled' : ''}
              class="relative ml-3 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
              Вперед
            </button>
          </div>

          <!-- Desktop pagination -->
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-slate-700 font-normal">
                Показано від <span class="font-bold text-slate-800">${start + 1}</span> до <span class="font-bold text-slate-800">${Math.min(end, total)}</span> з <span class="font-bold text-slate-800">${total}</span> товарів
              </p>
            </div>
            <div>
              <nav class="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-slate-50 border border-slate-200 p-1 gap-1" aria-label="Pagination">
                <button type="button" id="prev-prod-page-desktop" ${page === 1 ? 'disabled' : ''}
                  class="relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all cursor-pointer">
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                ${pageNumbers.map(n => {
                  if (n === '...') {
                    return `<span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-400 font-normal">...</span>`
                  }
                  const active = n === page
                  return `
                    <button type="button" data-prod-page-num="${n}"
                      class="relative inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                        active 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                      }">
                      ${n}
                    </button>`
                }).join('')}

                <button type="button" id="next-prod-page-desktop" ${page === totalPages ? 'disabled' : ''}
                  class="relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all cursor-pointer">
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>`

      const setProductsPage = (newPage) => {
        window.history.pushState(null, '', `/category/${categoryId}?page=${newPage}`)
        renderProductsPage(newPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }

      if (page > 1) {
        paginationContainer.querySelector('#prev-prod-page-mobile')?.addEventListener('click', () => setProductsPage(page - 1))
        paginationContainer.querySelector('#prev-prod-page-desktop')?.addEventListener('click', () => setProductsPage(page - 1))
      }
      if (page < totalPages) {
        paginationContainer.querySelector('#next-prod-page-mobile')?.addEventListener('click', () => setProductsPage(page + 1))
        paginationContainer.querySelector('#next-prod-page-desktop')?.addEventListener('click', () => setProductsPage(page + 1))
      }

      paginationContainer.querySelectorAll('[data-prod-page-num]').forEach(btn => {
        btn.addEventListener('click', () => {
          const num = parseInt(btn.getAttribute('data-prod-page-num'))
          setProductsPage(num)
        })
      })
    }

    const searchParams = new URLSearchParams(window.location.search)
    const initialPage = parseInt(searchParams.get('page')) || 1
    renderProductsPage(initialPage)

  } catch (err) {
    container.innerHTML = `
      <div class="text-center py-16">
        <p class="text-slate-500 mb-4">Категорію не знайдено або помилка завантаження</p>
        <a href="/categories" class="text-indigo-600 hover:text-indigo-700 font-medium">← Повернутись до каталогу</a>
      </div>`
  }

  return container
}
