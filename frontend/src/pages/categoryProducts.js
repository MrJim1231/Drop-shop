import { api } from '../api/client.js'
import { productCard, loadingSpinner, escapeHtml, slugify } from '../utils.js'

const PAGE_SIZE = 16

export async function renderCategoryProducts(categoryId) {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'

  // Rozetka layout structure
  container.innerHTML = `
    <nav class="text-sm text-slate-500 mb-6" id="breadcrumb">
      <a href="/" class="hover:text-indigo-600">Головна</a>
      <span class="mx-2">/</span>
      <a href="/categories" class="hover:text-indigo-600">Каталог</a>
      <span class="mx-2">/</span>
      <span id="breadcrumb-name" class="text-slate-800">...</span>
    </nav>
    
    <div id="category-header" class="mb-6">${loadingSpinner()}</div>

    <!-- Мобільна кнопка фільтрів -->
    <div class="lg:hidden flex items-center justify-between mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
      <span class="text-xs font-semibold text-slate-600">Фільтри та категорії</span>
      <button type="button" id="toggle-mobile-filters" class="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer">
        Показати
      </button>
    </div>

    <!-- Мобільний блок фільтрів (випадаючий) -->
    <div id="mobile-filters-drawer" class="hidden lg:hidden mb-6"></div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Лівий сайдбар як на Розетка (десктоп) -->
      <aside class="lg:col-span-1 hidden lg:block" id="catalog-sidebar"></aside>

      <!-- Основний контент товарів -->
      <div class="lg:col-span-3">
        <div id="category-content">${loadingSpinner()}</div>
        <div id="products-pagination-container" class="mt-8"></div>
      </div>
    </div>`

  try {
    // 1. Fetch data
    const category = await api.getCategory(categoryId)
    const subcategories = category.subcategories || []
    const categoriesList = await api.getCategories()

    container.querySelector('#breadcrumb-name').textContent = category.name

    if (category.parent_category) {
      const breadcrumb = container.querySelector('#breadcrumb')
      const parentLink = document.createElement('span')
      parentLink.innerHTML = `
        <span class="mx-2">/</span>
        <a href="/category/${category.parent_category.id}-${slugify(category.parent_category.name)}" class="hover:text-indigo-600">${escapeHtml(category.parent_category.name)}</a>`
      breadcrumb.insertBefore(parentLink, container.querySelector('#breadcrumb-name'))
    }

    container.querySelector('#category-header').innerHTML = `
      <h1 class="text-3xl font-bold text-slate-800">${escapeHtml(category.name)}</h1>`

    const contentEl = container.querySelector('#category-content')

    if (subcategories.length > 0) {
      const desktopSidebar = container.querySelector('#catalog-sidebar')
      const mobileSidebar = container.querySelector('#mobile-filters-drawer')
      
      const simpleSidebarHtml = renderSubcategorySidebarHtml(categoriesList, categoryId)
      if (desktopSidebar) desktopSidebar.innerHTML = simpleSidebarHtml
      if (mobileSidebar) mobileSidebar.innerHTML = simpleSidebarHtml

      // Add category count label
      const headerCount = document.createElement('p')
      headerCount.className = 'text-slate-500 mt-2'
      headerCount.textContent = `${subcategories.length} підкатегорій`
      container.querySelector('#category-header').appendChild(headerCount)

      // Mobile Sidebar Toggle
      container.querySelector('#toggle-mobile-filters')?.addEventListener('click', (e) => {
        const isHidden = mobileSidebar.classList.contains('hidden')
        if (isHidden) {
          mobileSidebar.classList.remove('hidden')
          e.target.textContent = 'Приховати'
        } else {
          mobileSidebar.classList.add('hidden')
          e.target.textContent = 'Показати'
        }
      })

      contentEl.innerHTML = `
        <p class="text-slate-500 mb-6">Оберіть підкатегорію</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          ${subcategories.map((cat) => `
            <a href="/category/${cat.id}-${slugify(cat.name)}" class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all">
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
      container.querySelector('#toggle-mobile-filters')?.parentElement?.classList.add('hidden')
      return container
    }

    const products = await api.getProductsByCategory(categoryId)

    if (!products.length) {
      contentEl.innerHTML = `<p class="text-center text-slate-500 py-16">У цій категорії поки немає товарів</p>`
      container.querySelector('#category-header').innerHTML += `
        <p class="text-slate-500 mt-2">0 товарів</p>`
      container.querySelector('#products-pagination-container').innerHTML = ''
      container.querySelector('#toggle-mobile-filters')?.parentElement?.classList.add('hidden')
      return container
    }

    // Filter state
    let activeMinPrice = null
    let activeMaxPrice = null
    let activeSuppliers = []

    // Build unique suppliers list
    const uniqueSuppliers = [...new Set(products.map(p => p.supplier || 'Інші / Невідомо'))].filter(Boolean)

    // Render Sidebars
    const desktopSidebar = container.querySelector('#catalog-sidebar')
    const mobileSidebar = container.querySelector('#mobile-filters-drawer')
    
    const sidebarHtml = renderSidebarHtml(categoriesList, uniqueSuppliers, categoryId)
    desktopSidebar.innerHTML = sidebarHtml
    mobileSidebar.innerHTML = sidebarHtml

    // Add count label
    const headerCount = document.createElement('p')
    headerCount.className = 'text-slate-500 mt-2'
    headerCount.textContent = `${products.length} товарів`
    container.querySelector('#category-header').appendChild(headerCount)

    function renderProductsPage(page) {
      let filteredProducts = products

      if (activeMinPrice !== null) {
        filteredProducts = filteredProducts.filter(p => p.price >= activeMinPrice)
      }
      if (activeMaxPrice !== null) {
        filteredProducts = filteredProducts.filter(p => p.price <= activeMaxPrice)
      }
      if (activeSuppliers.length > 0) {
        filteredProducts = filteredProducts.filter(p => activeSuppliers.includes(p.supplier || 'Інші / Невідомо'))
      }

      const total = filteredProducts.length
      const totalPages = Math.ceil(total / PAGE_SIZE)
      headerCount.textContent = `${total} товарів`

      if (page < 1) page = 1
      if (page > totalPages) page = totalPages

      const start = (page - 1) * PAGE_SIZE
      const end = start + PAGE_SIZE
      const pageProducts = filteredProducts.slice(start, end)

      if (!filteredProducts.length) {
        contentEl.innerHTML = `<p class="text-center text-slate-500 py-16 font-normal">Не знайдено товарів за обраними фільтрами</p>`
        container.querySelector('#products-pagination-container').innerHTML = ''
        return
      }

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
        window.history.pushState(null, '', `/category/${categoryId}-${slugify(category.name)}?page=${newPage}`)
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

    // Bind filters handlers
    const bindFilterEvents = (panel, isMobile = false) => {
      const minInput = panel.querySelector('.price-min')
      const maxInput = panel.querySelector('.price-max')
      const applyBtn = panel.querySelector('.apply-btn')
      const resetBtn = panel.querySelector('.reset-btn')

      applyBtn?.addEventListener('click', () => {
        activeMinPrice = minInput.value !== '' ? parseFloat(minInput.value) : null
        activeMaxPrice = maxInput.value !== '' ? parseFloat(maxInput.value) : null
        
        activeSuppliers = []
        panel.querySelectorAll('.supplier-cb:checked').forEach(cb => {
          activeSuppliers.push(cb.getAttribute('data-supplier-name'))
        })

        // Sync values to the other panel
        const otherPanel = isMobile ? desktopSidebar : mobileSidebar
        if (otherPanel) {
          const otherMin = otherPanel.querySelector('.price-min')
          const otherMax = otherPanel.querySelector('.price-max')
          if (otherMin) otherMin.value = minInput.value
          if (otherMax) otherMax.value = maxInput.value
          otherPanel.querySelectorAll('.supplier-cb').forEach(cb => {
            const name = cb.getAttribute('data-supplier-name')
            cb.checked = activeSuppliers.includes(name)
          })
        }

        if (isMobile) {
          mobileSidebar.classList.add('hidden')
          container.querySelector('#toggle-mobile-filters').textContent = 'Показати'
        }

        renderProductsPage(1)
      })

      resetBtn?.addEventListener('click', () => {
        activeMinPrice = null
        activeMaxPrice = null
        activeSuppliers = []
        
        minInput.value = ''
        maxInput.value = ''
        panel.querySelectorAll('.supplier-cb').forEach(cb => cb.checked = false)

        // Sync values to the other panel
        const otherPanel = isMobile ? desktopSidebar : mobileSidebar
        if (otherPanel) {
          const otherMin = otherPanel.querySelector('.price-min')
          const otherMax = otherPanel.querySelector('.price-max')
          if (otherMin) otherMin.value = ''
          if (otherMax) otherMax.value = ''
          otherPanel.querySelectorAll('.supplier-cb').forEach(cb => cb.checked = false)
        }

        if (isMobile) {
          mobileSidebar.classList.add('hidden')
          container.querySelector('#toggle-mobile-filters').textContent = 'Показати'
        }

        renderProductsPage(1)
      })
    }

    bindFilterEvents(desktopSidebar, false)
    bindFilterEvents(mobileSidebar, true)

    // Mobile Sidebar Toggle
    container.querySelector('#toggle-mobile-filters')?.addEventListener('click', (e) => {
      const isHidden = mobileSidebar.classList.contains('hidden')
      if (isHidden) {
        mobileSidebar.classList.remove('hidden')
        e.target.textContent = 'Приховати'
      } else {
        mobileSidebar.classList.add('hidden')
        e.target.textContent = 'Показати'
      }
    })

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

function renderSidebarHtml(categoriesList, uniqueSuppliers, currentCategoryId) {
  const rootIds = [1000001, 1000002, 1000003, 1000004, 1000005, 1000006, 1000007, 1000008, 1000009, 1000010, 1000011, 1000012, 1000013, 1000014, 1000015, 1000016, 1000017, 1000018, 1000019, 1000020]
  let filtered = categoriesList.filter(c => rootIds.includes(Number(c.id)))
  if (filtered.length === 0) {
    filtered = categoriesList
  }

  return `
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <!-- Категорії -->
      <div>
        <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3">Категорії</h3>
        <ul class="space-y-1.5 pl-1">
          ${filtered.map(c => `
            <li>
              <a href="/category/${c.id}-${slugify(c.name)}" 
                class="group flex items-center justify-between text-xs font-semibold py-1 text-slate-600 hover:text-indigo-600 transition-colors ${c.id == currentCategoryId ? 'text-indigo-600 font-bold' : ''}">
                <span>${escapeHtml(c.name)}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </div>

      <hr class="border-slate-200 my-4" />

      <!-- Фільтрація за ціною -->
      <div>
        <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3">Ціна (₴)</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <input type="number" class="price-min w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-indigo-500 text-slate-700 font-normal outline-none transition-all" placeholder="Від ₴" />
            <span class="text-slate-400 text-xs font-normal">—</span>
            <input type="number" class="price-max w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-indigo-500 text-slate-700 font-normal outline-none transition-all" placeholder="До ₴" />
          </div>
          <button type="button" class="apply-btn w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer">
            ОК
          </button>
        </div>
      </div>

      ${uniqueSuppliers.length > 1 ? `
        <hr class="border-slate-200 my-4" />
        <!-- Постачальники -->
        <div>
          <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3">Постачальник</h3>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            ${uniqueSuppliers.map(s => `
              <label class="flex items-center gap-2.5 text-xs text-slate-600 font-semibold cursor-pointer">
                <input type="checkbox" data-supplier-name="${escapeHtml(s)}" class="supplier-cb w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                <span class="truncate">${escapeHtml(s)}</span>
              </label>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <hr class="border-slate-200 my-4" />

      <!-- Скинути фільтри -->
      <button type="button" class="reset-btn w-full py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors cursor-pointer">
        Скинути фільтри
      </button>
    </div>`
}

function renderSubcategorySidebarHtml(categoriesList, currentCategoryId) {
  const rootIds = [1000001, 1000002, 1000003, 1000004, 1000005, 1000006, 1000007, 1000008, 1000009, 1000010, 1000011, 1000012, 1000013, 1000014, 1000015, 1000016, 1000017, 1000018, 1000019, 1000020]
  let filtered = categoriesList.filter(c => rootIds.includes(Number(c.id)))
  if (filtered.length === 0) {
    filtered = categoriesList
  }

  return `
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div>
        <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3">Категорії</h3>
        <ul class="space-y-1.5 pl-1">
          ${filtered.map(c => `
            <li>
              <a href="/category/${c.id}-${slugify(c.name)}" 
                class="group flex items-center justify-between text-xs font-semibold py-1 text-slate-600 hover:text-indigo-600 transition-colors ${c.id == currentCategoryId ? 'text-indigo-600 font-bold' : ''}">
                <span>${escapeHtml(c.name)}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>`
}
