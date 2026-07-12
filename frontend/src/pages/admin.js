import { authStore } from '../store/auth.js'
import { api } from '../api/client.js'
import { showToast, loadingSpinner, escapeHtml } from '../utils.js'
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
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <!-- Завантаження файлу каталогу -->
      <div class="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
        <div>
          <h2 class="text-xl font-bold text-slate-800 mb-2">1. Завантажити Excel-каталог</h2>
          <p class="text-sm text-slate-500 mb-6 font-normal">Завантажте Excel файл каталогу (.xlsx) на сервер для подальшого локального імпорту.</p>
          
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
          <p class="text-sm text-slate-500 mb-6 font-normal">Вкажіть посилання на XML/YML фід постачальника для прямого імпорту товарів з інтернету.</p>
          
          <div class="space-y-4">
            <label class="flex items-center gap-3 cursor-pointer bg-white p-4 border border-slate-200 rounded-xl font-normal">
              <input type="checkbox" id="reset-db" class="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
              <div>
                <p class="text-sm font-semibold text-slate-800">Повне очищення бази перед імпортом</p>
                <p class="text-xs text-slate-500 font-normal">Видалить усі старі товари та категорії перед завантаженням нових</p>
              </div>
            </label>

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

  // Load catalog files list
  loadCatalogsList()

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
    const importUrl = `${API_URL}../scripts/import_xml.php?url=${encodeURIComponent(url)}${isReset ? '&reset=1' : ''}`
    
    consoleTitle.textContent = 'import_xml.php'
    consoleContainer.classList.remove('hidden')
    importTerminal.src = importUrl
    
    consoleContainer.scrollIntoView({ behavior: 'smooth' })
    showToast('Імпорт XML посилання запущено. Слідкуйте за консоллю.', 'info')
  })

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
          const importUrl = `${API_URL}../scripts/import_products.php?file=${encodeURIComponent(fileName)}${isReset ? '&reset=1' : ''}`
          
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
