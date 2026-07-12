import { api } from '../api/client.js'
import { escapeHtml, loadingSpinner, slugify } from '../utils.js'

const PAGE_SIZE = 16

export async function renderCategories() {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
  container.innerHTML = `
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-slate-800">Каталог категорій</h1>
      <p class="text-slate-500 mt-2">Оберіть розділ для перегляду товарів</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Лівий сайдбар категорій -->
      <aside class="lg:col-span-1 hidden lg:block" id="categories-sidebar"></aside>

      <!-- Основний контент (сітка категорій) -->
      <div class="lg:col-span-3">
        <div id="categories-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          ${loadingSpinner()}
        </div>
        <div id="pagination-container" class="mt-8"></div>
      </div>
    </div>`

  try {
    const allCategories = await api.getCategories()
    const rootIds = [1000001, 1000002, 1000003, 1000004, 1000005, 1000006, 1000007, 1000008, 1000009, 1000010, 1000011, 1000012, 1000013, 1000014, 1000015, 1000016, 1000017, 1000018, 1000019, 1000020]
    let categories = allCategories.filter(c => rootIds.includes(Number(c.id)))
    if (categories.length === 0) {
      categories = allCategories
    }

    // Render left sidebar
    const sidebarEl = container.querySelector('#categories-sidebar')
    if (sidebarEl) {
      sidebarEl.innerHTML = renderSidebarHtml(allCategories, null)
    }
    
    function renderPage(page) {
      const grid = container.querySelector('#categories-grid')
      const paginationContainer = container.querySelector('#pagination-container')
      
      const total = categories.length
      const totalPages = Math.ceil(total / PAGE_SIZE)

      if (page < 1) page = 1
      if (page > totalPages) page = totalPages

      const start = (page - 1) * PAGE_SIZE
      const end = start + PAGE_SIZE
      const pageCategories = categories.slice(start, end)

      grid.innerHTML = pageCategories.map((cat) => `
        <a href="/category/${cat.id}-${slugify(cat.name)}" class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all">
          <div class="aspect-[4/3] bg-slate-100 overflow-hidden">
            <img src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">${escapeHtml(cat.name)}</h3>
          </div>
        </a>
      `).join('')

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
            <button type="button" id="prev-page-mobile" ${page === 1 ? 'disabled' : ''}
              class="relative inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
              Назад
            </button>
            <button type="button" id="next-page-mobile" ${page === totalPages ? 'disabled' : ''}
              class="relative ml-3 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
              Вперед
            </button>
          </div>

          <!-- Desktop pagination -->
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-slate-700 font-normal">
                Показано від <span class="font-bold text-slate-800">${start + 1}</span> до <span class="font-bold text-slate-800">${Math.min(end, total)}</span> з <span class="font-bold text-slate-800">${total}</span> категорій
              </p>
            </div>
            <div>
              <nav class="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-slate-50 border border-slate-200 p-1 gap-1" aria-label="Pagination">
                <button type="button" id="prev-page-desktop" ${page === 1 ? 'disabled' : ''}
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
                    <button type="button" data-page-num="${n}"
                      class="relative inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                        active 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                      }">
                      ${n}
                    </button>`
                }).join('')}

                <button type="button" id="next-page-desktop" ${page === totalPages ? 'disabled' : ''}
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

      const setPage = (newPage) => {
        window.history.pushState(null, '', `/categories?page=${newPage}`)
        renderPage(newPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }

      if (page > 1) {
        paginationContainer.querySelector('#prev-page-mobile')?.addEventListener('click', () => setPage(page - 1))
        paginationContainer.querySelector('#prev-page-desktop')?.addEventListener('click', () => setPage(page - 1))
      }
      if (page < totalPages) {
        paginationContainer.querySelector('#next-page-mobile')?.addEventListener('click', () => setPage(page + 1))
        paginationContainer.querySelector('#next-page-desktop')?.addEventListener('click', () => setPage(page + 1))
      }

      paginationContainer.querySelectorAll('[data-page-num]').forEach(btn => {
        btn.addEventListener('click', () => {
          const num = parseInt(btn.getAttribute('data-page-num'))
          setPage(num)
        })
      })
    }

    const searchParams = new URLSearchParams(window.location.search)
    const initialPage = parseInt(searchParams.get('page')) || 1
    renderPage(initialPage)

  } catch {
    container.innerHTML = `<p class="text-center text-slate-500 py-16">Не вдалося завантажити категорії. Перевірте підключення до бекенду.</p>`
  }

  return container
}

function renderSidebarHtml(categoriesList, currentCategoryId) {
  return `
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div>
        ${renderCategoriesTreeHtml(categoriesList, currentCategoryId)}
      </div>
    </div>`
}

function renderCategoriesTreeHtml(categoriesList, currentCategoryId) {
  const rootIds = [1000001, 1000002, 1000003, 1000004, 1000005, 1000006, 1000007, 1000008, 1000009, 1000010, 1000011, 1000012, 1000013, 1000014, 1000015, 1000016, 1000017, 1000018, 1000019, 1000020]
  let filtered = categoriesList.filter(c => rootIds.includes(Number(c.id)))
  if (filtered.length === 0) {
    filtered = categoriesList
  }

  return `
    <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3">Категорії</h3>
    <ul class="space-y-2 pl-1">
      ${filtered.map(c => {
        const hasSubcategories = Array.isArray(c.subcategories) && c.subcategories.length > 0
        const isDirectActive = Number(c.id) === Number(currentCategoryId)
        const hasActiveChild = hasSubcategories && c.subcategories.some(sub => Number(sub.id) === Number(currentCategoryId))
        const isExpanded = isDirectActive || hasActiveChild

        return `
          <li class="space-y-1">
            <a href="/category/${c.id}-${slugify(c.name)}" 
              class="group flex items-center justify-between text-xs py-1 transition-colors ${isDirectActive ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-indigo-600 font-semibold'}">
              <span>${escapeHtml(c.name)}</span>
              ${hasSubcategories ? `<span class="text-[10px] text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}">▶</span>` : ''}
            </a>
            
            ${hasSubcategories && isExpanded ? `
              <ul class="pl-4 space-y-1 border-l border-slate-100 my-1">
                ${c.subcategories.map(sub => {
                  const isSubActive = Number(sub.id) === Number(currentCategoryId)
                  return `
                    <li>
                      <a href="/category/${sub.id}-${slugify(sub.name)}" 
                        class="block py-1 text-[11px] transition-colors ${isSubActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-indigo-600 font-medium'}">
                        ${escapeHtml(sub.name)}
                      </a>
                    </li>
                  `
                }).join('')}
              </ul>
            ` : ''}
          </li>
        `
      }).join('')}
    </ul>`
}
