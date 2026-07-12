import { authStore } from '../store/auth.js'
import { api } from '../api/client.js'
import { showToast, loadingSpinner, escapeHtml, formatPrice } from '../utils.js'
import { API_URL } from '../api/config.js'

export async function renderAdmin() {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-4xl mx-auto px-4 py-8'

  const userId = authStore.getUserId()

  if (!authStore.isLoggedIn() || !userId) {
    showAccessDenied(container)
    return container
  }

  container.innerHTML = `
    <div class="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
      <h1 class="text-3xl font-bold text-slate-800 mb-8">Панель адміністратора</h1>
      <div id="admin-loader" class="py-12">
        ${loadingSpinner()}
      </div>
      <div id="admin-content" class="hidden"></div>
    </div>`

  try {
    const profile = await api.getProfile(userId)
    if (profile.status === 'success' && profile.data) {
      const email = profile.data.email
      if (email === 'berolegnik@gmail.com' || email === 'test@example.com') {
        renderAdminDashboard(container.querySelector('#admin-content'), container.querySelector('#admin-loader'))
      } else {
        showAccessDenied(container)
      }
    } else {
      showAccessDenied(container)
    }
  } catch (err) {
    showAccessDenied(container)
  }

  return container
}

function showAccessDenied(container) {
  container.innerHTML = `
    <div class="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
      <div class="text-6xl mb-4">🚫</div>
      <h1 class="text-2xl font-bold text-slate-800">Доступ заборонено</h1>
      <p class="text-slate-500 mt-2 mb-8">У вас немає прав доступу до панелі адміністратора.</p>
      <a href="/" class="inline-flex px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">
        На головну
      </a>
    </div>`
}

function renderAdminDashboard(contentEl, loaderEl) {
  loaderEl.classList.add('hidden')
  contentEl.classList.remove('hidden')

  contentEl.innerHTML = `
    <!-- Секція статистики -->
    <div id="admin-stats-container" class="mb-8"></div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <!-- Завантаження файлу каталогу -->
      <div class="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
        <div>
          <h2 class="text-xl font-bold text-slate-800 mb-2">1. Завантажити Excel-каталог</h2>
          <p class="text-sm text-slate-500 mb-6 font-normal">Завантажте Excel файл каталогу (.xlsx) на сервер для локального імпорту.</p>
          
          <form id="upload-form" class="space-y-4">
            <div id="drop-zone" class="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer bg-white transition-all">
              <div class="text-4xl mb-3">📄</div>
              <p class="text-sm font-medium text-slate-700">Перетягніть файл сюди або натисніть для вибору</p>
              <p class="text-xs text-slate-400 mt-1 font-normal">Дозволено лише .xlsx файли</p>
              <input type="file" id="catalog-file" name="catalog" accept=".xlsx" class="hidden" />
            </div>
            
            <div id="file-info" class="hidden flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl">
              <span id="file-name" class="text-sm text-slate-600 font-medium truncate max-w-[250px]">file.xlsx</span>
              <button type="button" id="remove-file-btn" class="text-red-500 hover:text-red-700 text-sm font-medium">Видалити</button>
            </div>

            <button type="submit" id="upload-btn" disabled
              class="w-full py-3 bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md">
              Завантажити на сервер
            </button>
          </form>
        </div>
      </div>

      <!-- Імпорт за XML/YML посиланням -->
      <div class="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
        <div>
          <h2 class="text-xl font-bold text-slate-800 mb-2">2. Імпорт за XML/YML посиланням</h2>
          <p class="text-sm text-slate-500 mb-6 font-normal">Вкажіть посилання на XML/YML фід постачальника для прямого імпорту товарів.</p>
          
          <div class="space-y-4">
            <label class="flex items-center gap-3 cursor-pointer bg-white p-4 border border-slate-200 rounded-xl font-normal">
              <input type="checkbox" id="reset-db" class="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
              <div>
                <p class="text-sm font-semibold text-slate-800">Повне очищення бази перед імпортом</p>
                <p class="text-xs text-slate-500 font-normal">Видалить усі старі товари та категорії перед завантаженням нових</p>
              </div>
            </label>

            <div>
              <label for="markup-percent" class="block text-sm font-medium text-slate-700 mb-2">Націнка на ціну товарів (%)</label>
              <input type="number" id="markup-percent" min="0" value="0" placeholder="0"
                class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-normal text-sm" />
              <p class="text-xs text-slate-400 mt-1.5 font-normal">Буде додано зазначений відсоток до оригінальної ціни постачальника</p>
            </div>

            <div>
              <label for="xml-url" class="block text-sm font-medium text-slate-700 mb-2">Посилання на XML/YML каталог</label>
              <input type="url" id="xml-url" placeholder="https://opt-drop.com/storage/xml/opt-drop-20.xml"
                class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-normal text-sm" />
            </div>
          </div>
        </div>

        <div class="mt-6">
          <button type="button" id="run-xml-import-btn"
            class="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md cursor-pointer">
            Запустити імпорт з XML посилання
          </button>
        </div>
      </div>
    </div>

    <!-- Список файлів каталогів -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
      <h2 class="text-xl font-bold text-slate-800 mb-4">3. Завантажені Excel каталоги (.xlsx)</h2>
      <div id="catalogs-list-container" class="overflow-x-auto">
        <!-- Таблиця файлів завантажується сюди -->
      </div>
    </div>

    <!-- Консоль логів імпорту -->
    <div id="console-container" class="mt-8 hidden">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-bold text-slate-800">Консоль імпорту (Лог виконання)</h3>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          Виконується...
        </span>
      </div>
      <div class="border border-slate-800 bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
        <div class="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span class="text-xs text-slate-400 font-mono ml-2" id="console-title">console</span>
        </div>
        <iframe id="import-terminal" class="w-full h-[400px] bg-slate-950 border-0 m-0 p-0 block"></iframe>
      </div>
    </div>

    <!-- Управління знижками -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 mt-8">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-xl">🏷️</div>
        <div>
          <h2 class="text-xl font-bold text-slate-800">Управління знижками</h2>
          <p class="text-sm text-slate-500 font-normal">Знайдіть товар і встановіть йому знижку. Стара ціна буде відображатися закресленою.</p>
        </div>
      </div>

      <div class="flex gap-3 mb-6">
        <div class="relative flex-1">
          <input type="search" id="discount-search-input" placeholder="Введіть назву або ID товару..."
            class="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm text-slate-700" />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <button id="discount-search-btn" class="px-5 py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-indigo-600 transition-colors text-sm cursor-pointer">
          Знайти
        </button>
      </div>

      <div id="discount-results" class="hidden">
        <div id="discount-products-list" class="space-y-3 max-h-[500px] overflow-y-auto pr-1"></div>
      </div>

      <!-- Активні знижки -->
      <div class="mt-8 border-t border-slate-100 pt-6">
        <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>Активні знижки на сайті</span>
          <span id="active-discounts-count" class="text-xs font-normal bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Завантаження...</span>
        </h3>
        <div id="discounted-active-list" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
          <!-- Завантажується автоматично -->
        </div>
      </div>
    </div>`

  bindDashboardEvents(contentEl)
}

function bindDashboardEvents(container) {
  const dropZone = container.querySelector('#drop-zone')
  const fileInput = container.querySelector('#catalog-file')
  const fileInfo = container.querySelector('#file-info')
  const fileNameSpan = container.querySelector('#file-name')
  const removeFileBtn = container.querySelector('#remove-file-btn')
  const uploadBtn = container.querySelector('#upload-btn')
  const uploadForm = container.querySelector('#upload-form')

  const resetDbCheckbox = container.querySelector('#reset-db')
  const xmlUrlInput = container.querySelector('#xml-url')
  const runXmlImportBtn = container.querySelector('#run-xml-import-btn')

  const consoleContainer = container.querySelector('#console-container')
  const consoleTitle = container.querySelector('#console-title')
  const importTerminal = container.querySelector('#import-terminal')

  // Load stats & files list
  loadAdminStats()
  loadCatalogsList()
  bindDiscountSection(container)

  // Auto refresh stats when import script finishes execution (iframe loaded)
  importTerminal.addEventListener('load', () => {
    loadAdminStats()
  })

  // Drag & drop handlers
  dropZone.addEventListener('click', () => fileInput.click())

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropZone.classList.add('border-indigo-500', 'bg-indigo-50/20')
  })

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/20')
  })

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault()
    dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/20')
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  })

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0])
    }
  })

  function handleFileSelected(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'xlsx') {
      showToast('Дозволені лише файли з розширенням .xlsx', 'error')
      return
    }
    fileInput.files = createFileList(file)
    fileNameSpan.textContent = file.name
    dropZone.classList.add('hidden')
    fileInfo.classList.remove('hidden')
    uploadBtn.disabled = false
  }

  function createFileList(file) {
    const dt = new DataTransfer()
    dt.items.add(file)
    return dt.files
  }

  removeFileBtn.addEventListener('click', () => {
    fileInput.value = ''
    dropZone.classList.remove('hidden')
    fileInfo.classList.add('hidden')
    uploadBtn.disabled = true
  })

  // Submit file upload
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const file = fileInput.files[0]
    if (!file) return

    const originalText = uploadBtn.textContent
    uploadBtn.disabled = true
    uploadBtn.textContent = 'Завантаження...'

    const fd = new FormData()
    fd.append('catalog', file)

    try {
      const result = await api.uploadCatalog(fd)
      if (result.status === 'success') {
        showToast(result.message || 'Файл каталогу успішно завантажено на сервер!')
        fileInput.value = ''
        dropZone.classList.remove('hidden')
        fileInfo.classList.add('hidden')
        uploadBtn.disabled = true
        loadCatalogsList() // Refresh the catalogs table!
        loadAdminStats()   // Refresh stats!
      } else {
        showToast(result.message || 'Помилка завантаження', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Не вдалося завантажити каталог', 'error')
    } finally {
      uploadBtn.disabled = false
      uploadBtn.textContent = originalText
    }
  })

  // XML Import trigger
  runXmlImportBtn.addEventListener('click', () => {
    const url = xmlUrlInput.value.trim()
    if (!url) {
      showToast('Будь ласка, вкажіть коректне посилання на XML', 'error')
      return
    }

    const isReset = resetDbCheckbox.checked
    const markup = parseFloat(container.querySelector('#markup-percent')?.value) || 0
    const importUrl = `${API_URL}../scripts/import_xml.php?url=${encodeURIComponent(url)}${isReset ? '&reset=1' : ''}${markup > 0 ? `&markup=${markup}` : ''}`
    
    consoleTitle.textContent = 'import_xml.php'
    consoleContainer.classList.remove('hidden')
    importTerminal.src = importUrl
    
    consoleContainer.scrollIntoView({ behavior: 'smooth' })
    showToast('Імпорт XML посилання запущено. Слідкуйте за консоллю.', 'info')
  })

  async function loadAdminStats() {
    const statsContainer = container.querySelector('#admin-stats-container')
    statsContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-indigo-50/50 border border-indigo-100/80 rounded-2xl p-5 flex items-center gap-4">
          <div class="text-3xl">📦</div>
          <div>
            <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Товарів на сайті</p>
            <p class="text-2xl font-bold text-slate-800" id="stats-total-products">...</p>
          </div>
        </div>
        <div class="bg-indigo-50/50 border border-indigo-100/80 rounded-2xl p-5 flex items-center gap-4">
          <div class="text-3xl">🗂️</div>
          <div>
            <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Категорій на сайті</p>
            <p class="text-2xl font-bold text-slate-800" id="stats-total-categories">...</p>
          </div>
        </div>
        <div class="bg-indigo-50/50 border border-indigo-100/80 rounded-2xl p-5 flex flex-col justify-center">
          <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Товари за постачальниками</p>
          <div class="space-y-1.5 max-h-16 overflow-y-auto pr-1" id="stats-suppliers-list">
            <span class="text-xs text-slate-400 font-normal">Завантаження...</span>
          </div>
        </div>
      </div>`

    try {
      const res = await api.getStats()
      if (res.status === 'success' && res.data) {
        const data = res.data
        container.querySelector('#stats-total-products').textContent = data.total_products.toLocaleString()
        container.querySelector('#stats-total-categories').textContent = data.total_categories.toLocaleString()

        const list = container.querySelector('#stats-suppliers-list')
        if (data.suppliers && data.suppliers.length > 0) {
          list.innerHTML = data.suppliers.map(s => `
            <div class="flex items-center justify-between text-xs text-slate-700 font-medium">
              <span class="truncate max-w-[155px]" title="${escapeHtml(s.name)}">🔹 ${escapeHtml(s.name)}</span>
              <span class="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">${s.count}</span>
            </div>
          `).join('')
        } else {
          list.innerHTML = `<span class="text-xs text-slate-400 font-normal">Товари відсутні</span>`
        }
      }
    } catch (err) {
      statsContainer.innerHTML = `<div class="text-sm text-red-500 font-normal">Не вдалося завантажити статистику: ${escapeHtml(err.message)}</div>`
    }
  }

  async function loadCatalogsList() {
    const listContainer = container.querySelector('#catalogs-list-container')
    listContainer.innerHTML = loadingSpinner()

    try {
      const catalogs = await api.getCatalogs()
      if (!catalogs.length) {
        listContainer.innerHTML = `<p class="text-center text-slate-500 py-8 font-normal">Немає завантажених файлів каталогів (.xlsx) на сервері.</p>`
        return
      }

      listContainer.innerHTML = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="py-3 px-4 text-sm font-semibold text-slate-700">Ім'я файлу</th>
              <th class="py-3 px-4 text-sm font-semibold text-slate-700">Розмір</th>
              <th class="py-3 px-4 text-sm font-semibold text-slate-700">Завантажено</th>
              <th class="py-3 px-4 text-sm font-semibold text-slate-700 text-right">Дії</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${catalogs.map(cat => `
              <tr class="hover:bg-slate-50/50">
                <td class="py-3.5 px-4 text-sm font-semibold text-slate-800 truncate max-w-[200px]" title="${escapeHtml(cat.name)}">
                  📄 ${escapeHtml(cat.name)}
                </td>
                <td class="py-3.5 px-4 text-sm text-slate-500 font-normal">${escapeHtml(cat.size)}</td>
                <td class="py-3.5 px-4 text-sm text-slate-500 font-normal">${escapeHtml(cat.uploaded_at)}</td>
                <td class="py-3.5 px-4 text-sm text-right space-x-2">
                  <button type="button" data-import-file="${escapeHtml(cat.name)}"
                    class="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer">
                    Імпортувати
                  </button>
                  <button type="button" data-delete-file="${escapeHtml(cat.name)}"
                    class="inline-flex items-center px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-lg text-xs transition-colors cursor-pointer">
                    Видалити
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`

      // Bind events to import buttons
      listContainer.querySelectorAll('[data-import-file]').forEach(btn => {
        btn.addEventListener('click', () => {
          const fileName = btn.getAttribute('data-import-file')
          const isReset = resetDbCheckbox.checked
          const markup = parseFloat(container.querySelector('#markup-percent')?.value) || 0
          const importUrl = `${API_URL}../scripts/import_products.php?file=${encodeURIComponent(fileName)}${isReset ? '&reset=1' : ''}${markup > 0 ? `&markup=${markup}` : ''}`
          
          consoleTitle.textContent = 'import_products.php'
          consoleContainer.classList.remove('hidden')
          importTerminal.src = importUrl
          
          consoleContainer.scrollIntoView({ behavior: 'smooth' })
          showToast(`Імпорт файлу '${fileName}' запущено. Слідкуйте за консоллю.`, 'info')
        })
      })

      // Bind events to delete buttons
      listContainer.querySelectorAll('[data-delete-file]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const fileName = btn.getAttribute('data-delete-file')
          if (!confirm(`Ви дійсно бажаєте видалити файл '${fileName}' з сервера?`)) {
            return
          }

          try {
            const res = await api.deleteCatalog(fileName)
            if (res.status === 'success') {
              showToast(`Файл '${fileName}' успішно видалено.`)
              loadCatalogsList()
              loadAdminStats() // Refresh stats!
            } else {
              showToast(res.message || 'Помилка видалення', 'error')
            }
          } catch (err) {
            showToast(err.message || 'Не вдалося видалити файл', 'error')
          }
        })
      })

    } catch (err) {
      listContainer.innerHTML = `<p class="text-center text-red-500 py-8 font-normal">Не вдалося завантажити список файлів: ${escapeHtml(err.message)}</p>`
    }
  }
}

function bindDiscountSection(container) {
  const searchInput = container.querySelector('#discount-search-input')
  const searchBtn = container.querySelector('#discount-search-btn')
  const resultsDiv = container.querySelector('#discount-results')
  const productsList = container.querySelector('#discount-products-list')
  const activeList = container.querySelector('#discounted-active-list')
  const activeCountSpan = container.querySelector('#active-discounts-count')

  const loadActiveDiscounts = async () => {
    activeList.innerHTML = `<div class="col-span-full flex justify-center py-8"><div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>`
    try {
      const data = await api.getDiscountedProducts()
      const products = data.products || []
      activeCountSpan.textContent = products.length

      if (!products.length) {
        activeList.innerHTML = `<p class="col-span-full text-center text-slate-500 py-8 font-normal text-sm bg-slate-50 rounded-2xl border border-slate-200/60">Немає товарів з активними знижками на сайті.</p>`
        return
      }

      activeList.innerHTML = products.map(p => {
        const discount = parseInt(p.discount) || 0
        const image = p.image || 'https://placehold.co/64x64/f1f5f9/94a3b8?text=?'
        return `
          <div class="flex items-center gap-4 p-4 bg-rose-50/20 rounded-2xl border border-rose-100/60 hover:border-rose-200 hover:bg-rose-50/40 transition-all" data-product-id="${escapeHtml(p.id)}">
            <img src="${escapeHtml(image)}"
              class="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 line-clamp-1">${escapeHtml(p.name)}</p>
              <p class="text-xs text-slate-500 mt-0.5">ID: ${escapeHtml(p.id)}</p>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="text-sm font-bold text-rose-600">${Math.round(p.discounted_price)} грн</span>
                <span class="text-xs text-slate-400 line-through">${p.price} грн</span>
                <span class="text-[10px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded">-${discount}%</span>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <div class="relative">
                <input type="number" min="0" max="99" value="${discount}"
                  class="discount-input w-16 px-2 py-2 pr-5 border border-slate-200 rounded-xl text-sm text-center font-bold focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none" />
                <span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">%</span>
              </div>
              <button class="set-discount-btn px-3 py-2 bg-rose-600 text-white font-semibold text-xs rounded-xl hover:bg-rose-700 transition-colors cursor-pointer flex-shrink-0">
                Зберегти
              </button>
            </div>
          </div>`
      }).join('')

      // Bind save buttons in active list
      activeList.querySelectorAll('[data-product-id]').forEach(row => {
        const productId = row.getAttribute('data-product-id')
        const saveBtn = row.querySelector('.set-discount-btn')
        const discountInput = row.querySelector('.discount-input')

        saveBtn.addEventListener('click', async () => {
          const discount = Math.max(0, Math.min(99, parseInt(discountInput.value) || 0))
          saveBtn.disabled = true
          saveBtn.textContent = '...'
          try {
            await api.setDiscount(productId, discount)
            showToast(discount > 0 ? `Знижка ${discount}% збережена!` : 'Знижку знято')
            loadActiveDiscounts()
            if (!resultsDiv.classList.contains('hidden')) {
              doSearch()
            }
          } catch (err) {
            showToast(err.message || 'Помилка збереження', 'error')
            saveBtn.disabled = false
            saveBtn.textContent = 'Зберегти'
          }
        })
      })

    } catch (err) {
      activeCountSpan.textContent = '0'
      activeList.innerHTML = `<p class="col-span-full text-center text-red-500 py-6 text-sm">Не вдалося завантажити товари зі знижкою: ${escapeHtml(err.message)}</p>`
    }
  }

  const doSearch = async () => {
    const q = searchInput.value.trim()
    if (!q) { showToast('Введіть назву або ID товару', 'error'); return }

    searchBtn.disabled = true
    searchBtn.textContent = 'Пошук...'
    productsList.innerHTML = `<div class="flex justify-center py-8"><div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>`
    resultsDiv.classList.remove('hidden')

    try {
      const data = await api.searchProductsAdmin(q)
      const products = data.products || []

      if (!products.length) {
        productsList.innerHTML = `<p class="text-center text-slate-500 py-6 text-sm">Товарів не знайдено за запитом «${escapeHtml(q)}»</p>`
        return
      }

      productsList.innerHTML = products.slice(0, 20).map(p => {
        const discount = parseInt(p.discount) || 0
        const hasDiscount = discount > 0
        return `
          <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all" data-product-id="${escapeHtml(p.id)}">
            <img src="${escapeHtml(p.image || p.images?.[0] || 'https://placehold.co/64x64/f1f5f9/94a3b8?text=?')}"
              class="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 line-clamp-1">${escapeHtml(p.name)}</p>
              <p class="text-xs text-slate-500 mt-0.5">ID: ${escapeHtml(p.id)}</p>
              <div class="flex items-baseline gap-2 mt-1">
                ${hasDiscount
                  ? `<span class="text-sm font-bold text-rose-600">${p.discounted_price ? Math.round(p.discounted_price) + ' грн' : ''}</span>
                     <span class="text-xs text-slate-400 line-through">${p.price} грн</span>
                     <span class="text-[10px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded">-${discount}%</span>`
                  : `<span class="text-sm font-bold text-indigo-600">${p.price} грн</span>`
                }
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <div class="relative">
                <input type="number" min="0" max="99" value="${discount}"
                  class="discount-input w-20 px-3 py-2 pr-6 border border-slate-200 rounded-xl text-sm text-center font-bold focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">%</span>
              </div>
              <button class="set-discount-btn px-4 py-2 bg-rose-600 text-white font-semibold text-sm rounded-xl hover:bg-rose-700 transition-colors cursor-pointer flex-shrink-0">
                Зберегти
              </button>
            </div>
          </div>`
      }).join('')

      // Bind save buttons in search results
      productsList.querySelectorAll('[data-product-id]').forEach(row => {
        const productId = row.getAttribute('data-product-id')
        const saveBtn = row.querySelector('.set-discount-btn')
        const discountInput = row.querySelector('.discount-input')

        saveBtn.addEventListener('click', async () => {
          const discount = Math.max(0, Math.min(99, parseInt(discountInput.value) || 0))
          saveBtn.disabled = true
          saveBtn.textContent = '...'
          try {
            await api.setDiscount(productId, discount)
            showToast(discount > 0 ? `Знижка ${discount}% збережена!` : 'Знижку знято')
            discountInput.value = discount
            loadActiveDiscounts()
            doSearch()
          } catch (err) {
            showToast(err.message || 'Помилка збереження', 'error')
            saveBtn.disabled = false
            saveBtn.textContent = 'Зберегти'
          }
        })
      })
    } catch (err) {
      productsList.innerHTML = `<p class="text-center text-red-500 py-6 text-sm">Помилка пошуку: ${escapeHtml(err.message)}</p>`
    } finally {
      searchBtn.disabled = false
      searchBtn.textContent = 'Знайти'
    }
  }

  // Load discounted products on dashboard load
  loadActiveDiscounts()

  searchBtn.addEventListener('click', doSearch)
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch() })
}
