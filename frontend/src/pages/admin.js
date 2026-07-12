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
      // Дозволяємо доступ лише адміністраторам
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
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Завантаження файлу каталогу -->
      <div class="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h2 class="text-xl font-bold text-slate-800 mb-2">1. Завантажити Excel-каталог</h2>
        <p class="text-sm text-slate-500 mb-6">Виберіть Excel файл каталогу товарів (.xlsx) для завантаження на сервер.</p>
        
        <form id="upload-form" class="space-y-4">
          <div id="drop-zone" class="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer bg-white transition-all">
            <div class="text-4xl mb-3">📄</div>
            <p class="text-sm font-medium text-slate-700">Перетягніть файл сюди або натисніть для вибору</p>
            <p class="text-xs text-slate-400 mt-1">Дозволено лише .xlsx файли</p>
            <input type="file" id="catalog-file" name="catalog" accept=".xlsx" class="hidden" />
          </div>
          
          <div id="file-info" class="hidden flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl">
            <span id="file-name" class="text-sm text-slate-600 font-medium truncate max-w-[200px]">file.xlsx</span>
            <button type="button" id="remove-file-btn" class="text-red-500 hover:text-red-700 text-sm font-medium">Видалити</button>
          </div>

          <button type="submit" id="upload-btn" disabled
            class="w-full py-3 bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md">
            Завантажити файл
          </button>
        </form>
      </div>

      <!-- Запуск імпорту товарів -->
      <div class="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h2 class="text-xl font-bold text-slate-800 mb-2">2. Запустити імпорт товарів</h2>
        <p class="text-sm text-slate-500 mb-6">Запустіть обробку Excel каталогу для додавання та оновлення категорій і товарів у базі даних.</p>
        
        <div class="space-y-6">
          <label class="flex items-center gap-3 cursor-pointer bg-white p-4 border border-slate-200 rounded-xl">
            <input type="checkbox" id="reset-db" class="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
            <div>
              <p class="text-sm font-semibold text-slate-800">Повне очищення бази перед імпортом</p>
              <p class="text-xs text-slate-500">Видалить усі старі товари та категорії перед завантаженням нових</p>
            </div>
          </label>

          <button type="button" id="run-import-btn"
            class="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md">
            Запустити імпорт товарів
          </button>
        </div>
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
          <span class="text-xs text-slate-400 font-mono ml-2">import_products.php</span>
        </div>
        <iframe id="import-terminal" class="w-full h-80 bg-slate-950 border-0 m-0 p-0 block"></iframe>
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

  const runImportBtn = container.querySelector('#run-import-btn')
  const resetDbCheckbox = container.querySelector('#reset-db')
  const consoleContainer = container.querySelector('#console-container')
  const importTerminal = container.querySelector('#import-terminal')

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
        showToast('Файл каталогу успішно завантажено на сервер!')
        fileInput.value = ''
        dropZone.classList.remove('hidden')
        fileInfo.classList.add('hidden')
        uploadBtn.disabled = true
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

  // Start import
  runImportBtn.addEventListener('click', () => {
    const isReset = resetDbCheckbox.checked
    const importUrl = `${API_URL}../scripts/import_products.php${isReset ? '?reset=1' : ''}`
    
    consoleContainer.classList.remove('hidden')
    // Направляємо iframe на скрипт імпорту
    importTerminal.src = importUrl

    showToast('Імпорт запущено. Слідкуйте за консоллю.', 'info')
  })
}
