import { api } from '../api/client.js'
import { productCard, loadingSpinner, escapeHtml } from '../utils.js'

export async function renderSearch() {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'

  const searchParams = new URLSearchParams(window.location.search)
  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page')) || 1

  container.innerHTML = `
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-slate-800">Результати пошуку</h1>
      <p class="text-slate-500 mt-2" id="search-query-label">Пошуковий запит: "${escapeHtml(query)}"</p>
    </div>
    <div id="search-content">${loadingSpinner()}</div>
    <div id="search-pagination-container" class="mt-8"></div>`

  const contentEl = container.querySelector('#search-content')
  const paginationContainer = container.querySelector('#search-pagination-container')

  if (!query.trim()) {
    contentEl.innerHTML = `<p class="text-center text-slate-500 py-16">Будь ласка, введіть запит у пошуку.</p>`
    return container
  }

  try {
    const res = await api.searchProducts(query, page)
    const products = res.products || []
    const totalPages = res.total_pages || 1

    if (!products.length) {
      contentEl.innerHTML = `<p class="text-center text-slate-500 py-16">Нічого не знайдено за запитом "${escapeHtml(query)}". Спробуйте інші слова.</p>`
      paginationContainer.innerHTML = ''
      return container
    }

    contentEl.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      ${products.map((p) => productCard(p)).join('')}
    </div>`

    if (totalPages <= 1) {
      paginationContainer.innerHTML = ''
      return container
    }

    // Generate page numbers
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
          <button type="button" id="prev-search-page-mobile" ${page === 1 ? 'disabled' : ''}
            class="relative inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
            Назад
          </button>
          <button type="button" id="next-search-page-mobile" ${page === totalPages ? 'disabled' : ''}
            class="relative ml-3 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
            Вперед
          </button>
        </div>

        <!-- Desktop pagination -->
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-slate-700 font-normal">
              Сторінка <span class="font-bold text-slate-800">${page}</span> з <span class="font-bold text-slate-800">${totalPages}</span>
            </p>
          </div>
          <div>
            <nav class="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-slate-50 border border-slate-200 p-1 gap-1" aria-label="Pagination">
              <button type="button" id="prev-search-page-desktop" ${page === 1 ? 'disabled' : ''}
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
                  <button type="button" data-search-page-num="${n}"
                    class="relative inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                      active 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                    }">
                    ${n}
                  </button>`
              }).join('')}

              <button type="button" id="next-search-page-desktop" ${page === totalPages ? 'disabled' : ''}
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
      window.history.pushState(null, '', `/search?q=${encodeURIComponent(query)}&page=${newPage}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (page > 1) {
      paginationContainer.querySelector('#prev-search-page-mobile')?.addEventListener('click', () => setPage(page - 1))
      paginationContainer.querySelector('#prev-search-page-desktop')?.addEventListener('click', () => setPage(page - 1))
    }
    if (page < totalPages) {
      paginationContainer.querySelector('#next-search-page-mobile')?.addEventListener('click', () => setPage(page + 1))
      paginationContainer.querySelector('#next-search-page-desktop')?.addEventListener('click', () => setPage(page + 1))
    }

    paginationContainer.querySelectorAll('[data-search-page-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.getAttribute('data-search-page-num'))
        setPage(num)
      })
    })

  } catch (err) {
    contentEl.innerHTML = `<p class="text-center text-red-500 py-16 font-normal">Помилка завантаження результатів пошуку.</p>`
  }

  return container
}
