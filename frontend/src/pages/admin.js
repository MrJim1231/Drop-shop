import { authStore } from '../store/auth.js'
import { api } from '../api/client.js'
import { showToast, loadingSpinner, escapeHtml, formatPrice, slugify } from '../utils.js'
import { API_URL } from '../api/config.js'

let globalLoadAdminStats = null

export async function renderAdmin() {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-6xl mx-auto px-4 py-8'

  const userId = authStore.getUserId()

  if (!authStore.isLoggedIn() || !userId) {
    showAccessDenied(container)
    return container
  }

  container.innerHTML = `
    <div class="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 md:p-8 shadow-sm">
      <h1 class="text-3xl font-black text-slate-800 dark:text-slate-100 mb-8 tracking-tight">Панель адміністратора</h1>
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
    <div class="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-white/5 p-8 shadow-sm">
      <div class="text-6xl mb-4">🚫</div>
      <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">Доступ заборонено</h1>
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

    <!-- Таби навігації -->
    <div class="flex flex-wrap gap-2 border-b border-slate-100 dark:border-white/5 pb-4 mb-8">
      <button data-tab="import" class="admin-tab-btn px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-sm transition-all cursor-pointer">
        📥 Імпорт та статистика
      </button>
      <button data-tab="discounts" class="admin-tab-btn px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
        🏷️ Знижки
      </button>
      <button data-tab="categories" class="admin-tab-btn px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
        📁 Категорії
      </button>
      <button data-tab="products" class="admin-tab-btn px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
        🛍️ Товари
      </button>
    </div>

    <!-- Вміст табів -->
    
    <!-- 1. ТАБ: ІМПОРТ -->
    <div id="tab-content-import" class="admin-tab-pane space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Завантаження файлу каталогу -->
        <div class="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 flex flex-col justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">1. Завантажити Excel-каталог</h2>
            <p class="text-sm text-slate-500 mb-6 font-normal">Завантажте Excel файл каталогу (.xlsx) на сервер для локального імпорту.</p>
            
            <form id="upload-form" class="space-y-4">
              <div id="drop-zone" class="border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer bg-white dark:bg-slate-900 transition-all">
                <div class="text-4xl mb-3">📄</div>
                <p class="text-sm font-medium text-slate-700 dark:text-slate-300">Перетягніть файл сюди або натисніть для вибору</p>
                <p class="text-xs text-slate-400 mt-1 font-normal">Дозволено лише .xlsx файли</p>
                <input type="file" id="catalog-file" name="catalog" accept=".xlsx" class="hidden" />
              </div>
              
              <div id="file-info" class="hidden flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 border border-slate-200 dark:border-white/5 rounded-xl">
                <span id="file-name" class="text-sm text-slate-600 dark:text-slate-300 font-medium truncate max-w-[250px]">file.xlsx</span>
                <button type="button" id="remove-file-btn" class="text-red-500 hover:text-red-700 text-sm font-medium">Видалити</button>
              </div>

              <button type="submit" id="upload-btn" disabled
                class="w-full py-3 bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md">
                Завантажити на сервер
              </button>
            </form>
          </div>
        </div>

        <!-- Імпорт за XML/YML посиланням -->
        <div class="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 flex flex-col justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">2. Імпорт за XML/YML посиланням</h2>
            <p class="text-sm text-slate-500 mb-6 font-normal">Вкажіть посилання на XML/YML фід постачальника для прямого імпорту товарів.</p>
            
            <div class="space-y-4">
              <label class="flex items-center gap-3 cursor-pointer bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-white/5 rounded-xl font-normal">
                <input type="checkbox" id="reset-db" class="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                <div>
                  <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">Повне очищення бази перед імпортом</p>
                  <p class="text-xs text-slate-500 font-normal">Видалить усі старі товари та категорії перед завантаженням нових</p>
                </div>
              </label>

              <div>
                <label for="markup-percent" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Націнка на ціну товарів (%)</label>
                <input type="number" id="markup-percent" min="0" value="0" placeholder="0"
                  class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-normal text-sm text-slate-800 dark:text-slate-200" />
                <p class="text-xs text-slate-400 mt-1.5 font-normal">Буде додано зазначений відсоток до оригінальної ціни постачальника</p>
              </div>

              <div>
                <label for="xml-url" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Посилання на XML/YML каталог</label>
                <input type="url" id="xml-url" placeholder="https://opt-drop.com/storage/xml/opt-drop-20.xml"
                  class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-normal text-sm text-slate-800 dark:text-slate-200" />
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

      <!-- Список завантажених файлів -->
      <div class="bg-white dark:bg-slate-900/20 rounded-2xl border border-slate-200/60 dark:border-white/5 p-6">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">3. Завантажені Excel каталоги (.xlsx)</h2>
        <div id="catalogs-list-container" class="overflow-x-auto"></div>
      </div>

      <!-- Консоль логів -->
      <div id="console-container" class="mt-8 hidden">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">Консоль імпорту (Лог виконання)</h3>
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
    </div>

    <!-- 2. ТАБ: ЗНИЖКИ -->
    <div id="tab-content-discounts" class="admin-tab-pane hidden space-y-6">
      <div class="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-white/5 p-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-xl">🏷️</div>
          <div>
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">Управління знижками</h2>
            <p class="text-sm text-slate-500 font-normal">Знайдіть товар і встановіть знижку у відсотках.</p>
          </div>
        </div>

        <div class="flex gap-3 mb-6">
          <div class="relative flex-1">
            <input type="search" id="discount-search-input" placeholder="Введіть назву або ID товару..."
              class="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm text-slate-800 dark:text-slate-200" />
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
        <div class="mt-8 border-t border-slate-200 dark:border-white/5 pt-6">
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span>Active discounts on site</span>
            <span id="active-discounts-count" class="text-xs font-normal bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full">Loading...</span>
          </h3>
          <div id="discounted-active-list" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1"></div>
        </div>
      </div>
    </div>

    <!-- 3. ТАБ: КАТЕГОРІЇ (CRUD) -->
    <div id="tab-content-categories" class="admin-tab-pane hidden space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">Редактор категорій</h2>
          <p class="text-sm text-slate-500 font-normal">Створюйте нові категорії, змінюйте назви, додавайте зображення.</p>
        </div>
        <button id="add-category-btn" class="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-all cursor-pointer shadow-md">
          ➕ Додати категорію
        </button>
      </div>

      <!-- Слайд-даун форма створення/редагування категорії -->
      <div id="category-form-container" class="hidden bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 rounded-2xl p-6 shadow-inner transition-all">
        <h3 id="category-form-title" class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Створення категорії</h3>
        <form id="category-crud-form" class="space-y-4">
          <input type="hidden" id="category-id-field" value="" />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="category-name" class="block text-xs font-bold text-slate-500 uppercase mb-2">Назва категорії</label>
              <input type="text" id="category-name" required placeholder="Напр. Зимовий одяг"
                class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all" />
            </div>
            <div>
              <label for="category-parent" class="block text-xs font-bold text-slate-500 uppercase mb-2">Батьківська категорія</label>
              <select id="category-parent"
                class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all">
                <option value="">Немає (Коренева категорія)</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Зображення категорії</label>
            <div class="flex gap-3">
              <input type="text" id="category-image" placeholder="Введіть URL або виберіть файл..."
                class="flex-grow px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all" />
              <label class="px-4 py-3 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-indigo-650 hover:shadow transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                <span>📁 Файл</span>
                <input type="file" id="category-image-file" accept="image/*" class="hidden" />
              </label>
            </div>
            <p class="text-[10px] text-slate-400 mt-1 font-normal">Можна вставити пряме посилання або завантажити локальний файл (до 5MB)</p>
          </div>
          <div class="flex gap-2 justify-end">
            <button type="button" id="category-cancel-btn" class="px-4 py-2.5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer">
              Скасувати
            </button>
            <button type="submit" id="category-submit-btn" class="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 cursor-pointer">
              Зберегти
            </button>
          </div>
        </form>
      </div>

      <!-- Таблиця списку категорій -->
      <div class="bg-white dark:bg-slate-900/20 rounded-2xl border border-slate-200/60 dark:border-white/5 p-6">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse" id="admin-categories-table">
            <thead>
              <tr class="border-b border-slate-200 dark:border-white/5">
                <th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase">ID</th>
                <th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Зображення</th>
                <th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Назва</th>
                <th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Батьківська</th>
                <th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Дії</th>
              </tr>
            </thead>
            <tbody id="categories-crud-list" class="divide-y divide-slate-100 dark:divide-white/5"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 4. ТАБ: ТОВАРИ (CRUD) -->
    <div id="tab-content-products" class="admin-tab-pane hidden space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">Редактор товарів</h2>
          <p class="text-sm text-slate-500 font-normal">Створюйте нові товари, редагуйте описи, ціни та наявність.</p>
        </div>
        <button id="add-product-btn" class="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-all cursor-pointer shadow-md">
          ➕ Додати товар
        </button>
      </div>

      <!-- Слайд-даун форма створення/редагування товару -->
      <div id="product-form-container" class="hidden bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 rounded-2xl p-6 shadow-inner transition-all">
        <h3 id="product-form-title" class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Створення товару</h3>
        <form id="product-crud-form" class="space-y-4">
          <input type="hidden" id="product-action-type" value="create" />
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="product-id" class="block text-xs font-bold text-slate-500 uppercase mb-2">Артикул / SKU (ID)</label>
              <input type="text" id="product-id" required placeholder="Напр. SKU-9001"
                class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all" />
            </div>
            <div class="md:col-span-2">
              <label for="product-name" class="block text-xs font-bold text-slate-500 uppercase mb-2">Назва товару</label>
              <input type="text" id="product-name" required placeholder="Напр. Набір маркерів Touch 12шт"
                class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all" />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="product-price" class="block text-xs font-bold text-slate-500 uppercase mb-2">Ціна (грн)</label>
              <input type="number" step="0.01" min="0.01" id="product-price" required placeholder="0.00"
                class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all" />
            </div>
            <div>
              <label for="product-category" class="block text-xs font-bold text-slate-500 uppercase mb-2">Категорія товару</label>
              <select id="product-category" required
                class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all">
                <option value="">Виберіть категорію</option>
              </select>
            </div>
            <div>
              <label for="product-availability" class="block text-xs font-bold text-slate-500 uppercase mb-2">Наявність</label>
              <select id="product-availability"
                class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all">
                <option value="1">В наявності</option>
                <option value="0">Немає в наявності</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label for="product-size" class="block text-xs font-bold text-slate-500 uppercase mb-2">Розмір / Характеристика</label>
              <input type="text" id="product-size" placeholder="Напр. M, L або 40x40"
                class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all" />
            </div>
            <div>
              <label for="product-stock" class="block text-xs font-bold text-slate-500 uppercase mb-2">Кількість на складі</label>
              <input type="number" min="0" id="product-stock" value="10"
                class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all" />
            </div>
            <div>
              <label for="product-weight" class="block text-xs font-bold text-slate-500 uppercase mb-2">Вага (кг)</label>
              <input type="number" step="0.01" min="0" id="product-weight" placeholder="0.00"
                class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all" />
            </div>
            <div>
              <label for="product-supplier" class="block text-xs font-bold text-slate-500 uppercase mb-2">Постачальник</label>
              <input type="text" id="product-supplier" placeholder="Напр. Dropt"
                class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all" />
            </div>
          </div>
          <div>
            <label for="product-description" class="block text-xs font-bold text-slate-500 uppercase mb-2">Опис товару</label>
            <textarea id="product-description" rows="4" placeholder="Детальний опис товару..."
              class="w-full px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all resize-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Головне зображення</label>
            <div class="flex gap-3">
              <input type="text" id="product-image" placeholder="Введіть URL або виберіть файл..."
                class="flex-grow px-4 py-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all" />
              <label class="px-4 py-3 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-indigo-650 hover:shadow transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                <span>📁 Файл</span>
                <input type="file" id="product-image-file" accept="image/*" class="hidden" />
              </label>
            </div>
            <p class="text-[10px] text-slate-400 mt-1 font-normal">Можна вставити пряме посилання або завантажити локальний файл (до 5MB)</p>
          </div>
          <div class="flex gap-2 justify-end">
            <button type="button" id="product-cancel-btn" class="px-4 py-2.5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer">
              Скасувати
            </button>
            <button type="submit" id="product-submit-btn" class="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 cursor-pointer">
              Зберегти
            </button>
          </div>
        </form>
      </div>

      <!-- Пошук та таблиця товарів -->
      <div class="bg-white dark:bg-slate-900/20 rounded-2xl border border-slate-200/60 dark:border-white/5 p-6">
        <div class="flex gap-3 mb-6">
          <input type="search" id="product-search-input" placeholder="Шукати товари за назвою або SKU..."
            class="flex-grow px-4 py-2.5 border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-slate-800 dark:text-slate-200 transition-all" />
          <button id="product-search-btn" class="px-5 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors text-sm cursor-pointer">
            Пошук
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse" id="admin-products-table">
            <thead>
              <tr class="border-b border-slate-200 dark:border-white/5">
                <th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase">SKU / ID</th>
                <th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Зображення</th>
                <th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Назва</th>
                <th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Ціна</th>
                <th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Наявність</th>
                <th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Дії</th>
              </tr>
            </thead>
            <tbody id="products-crud-list" class="divide-y divide-slate-100 dark:divide-white/5"></tbody>
          </table>
        </div>
      </div>
    </div>`

  bindDashboardEvents(contentEl)
  bindTabs(contentEl)
  bindCategorySection(contentEl)
  bindProductSection(contentEl)
}

function bindTabs(container) {
  const tabs = container.querySelectorAll('.admin-tab-btn')
  const panes = container.querySelectorAll('.admin-tab-pane')

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const activeTab = btn.getAttribute('data-tab')
      
      tabs.forEach(t => {
        t.classList.remove('bg-indigo-600', 'text-white')
        t.classList.add('bg-slate-50', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300', 'hover:bg-slate-100', 'dark:hover:bg-slate-700')
      })
      btn.classList.add('bg-indigo-600', 'text-white')
      btn.classList.remove('bg-slate-50', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300', 'hover:bg-slate-100', 'dark:hover:bg-slate-700')

      panes.forEach(pane => {
        if (pane.id === `tab-content-${activeTab}`) {
          pane.classList.remove('hidden')
        } else {
          pane.classList.add('hidden')
        }
      })
    })
  })
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

  globalLoadAdminStats = loadAdminStats

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
        loadCatalogsList() // Refresh catalogs list!
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
            <div class="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium">
              <span class="truncate max-w-[155px]" title="${escapeHtml(s.name)}">🔹 ${escapeHtml(s.name)}</span>
              <span class="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold text-[10px]">${s.count}</span>
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
            <tr class="border-b border-slate-200 dark:border-white/5">
              <th class="py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Ім'я файлу</th>
              <th class="py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Розмір</th>
              <th class="py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Завантажено</th>
              <th class="py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 text-right">Дії</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            ${catalogs.map(cat => `
              <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td class="py-3.5 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title="${escapeHtml(cat.name)}">
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
        activeList.innerHTML = `<p class="col-span-full text-center text-slate-500 py-8 font-normal text-sm bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-white/5">Немає товарів з активними знижками на сайті.</p>`
        return
      }

      activeList.innerHTML = products.map(p => {
        const discount = parseInt(p.discount) || 0
        const image = p.image || p.images?.[0] || 'https://placehold.co/64x64/f1f5f9/94a3b8?text=?'
        return `
          <div class="flex items-center gap-4 p-4 bg-rose-50/20 dark:bg-rose-950/10 rounded-2xl border border-rose-100/60 dark:border-rose-950/20 hover:border-rose-200 hover:bg-rose-50/40 transition-all" data-product-id="${escapeHtml(p.id)}">
            <img src="${escapeHtml(image)}"
              class="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">${escapeHtml(p.name)}</p>
              <p class="text-xs text-slate-500 mt-0.5">ID: ${escapeHtml(p.id)}</p>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="text-sm font-bold text-rose-600 dark:text-rose-400">${Math.round(p.discounted_price)} грн</span>
                <span class="text-xs text-slate-400 line-through">${p.price} грн</span>
                <span class="text-[10px] font-black bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded">-${discount}%</span>
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
          <div class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-white/5 hover:border-indigo-200 transition-all" data-product-id="${escapeHtml(p.id)}">
            <img src="${escapeHtml(p.image || p.images?.[0] || 'https://placehold.co/64x64/f1f5f9/94a3b8?text=?')}"
              class="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">${escapeHtml(p.name)}</p>
              <p class="text-xs text-slate-500 mt-0.5">ID: ${escapeHtml(p.id)}</p>
              <div class="flex items-baseline gap-2 mt-1">
                ${hasDiscount
                  ? `<span class="text-sm font-bold text-rose-600 dark:text-rose-400">${p.discounted_price ? Math.round(p.discounted_price) + ' грн' : ''}</span>
                     <span class="text-xs text-slate-400 line-through">${p.price} грн</span>
                     <span class="text-[10px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded">-${discount}%</span>`
                  : `<span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">${p.price} грн</span>`
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

function bindCategorySection(container) {
  const addCategoryBtn = container.querySelector('#add-category-btn')
  const formContainer = container.querySelector('#category-form-container')
  const formTitle = container.querySelector('#category-form-title')
  const form = container.querySelector('#category-crud-form')
  const idField = container.querySelector('#category-id-field')
  const nameInput = container.querySelector('#category-name')
  const parentSelect = container.querySelector('#category-parent')
  const imageInput = container.querySelector('#category-image')
  const imageFileInput = container.querySelector('#category-image-file')
  const cancelBtn = container.querySelector('#category-cancel-btn')
  const submitBtn = container.querySelector('#category-submit-btn')
  const listBody = container.querySelector('#categories-crud-list')

  // Handle category image uploading via file
  imageFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const labelSpan = imageFileInput.parentElement.querySelector('span')
    const originalText = labelSpan.textContent
    labelSpan.textContent = '...'

    const fd = new FormData()
    fd.append('image', file)

    try {
      const res = await api.uploadImage(fd)
      if (res.status === 'success') {
        imageInput.value = res.url
        showToast('Зображення категорії завантажено!')
      } else {
        showToast(res.message || 'Помилка завантаження', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Не вдалося завантажити зображення', 'error')
    } finally {
      labelSpan.textContent = originalText
      imageFileInput.value = ''
    }
  })

  let categoriesCache = []

  const loadCategories = async () => {
    listBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center">${loadingSpinner()}</td></tr>`
    try {
      const res = await api.adminGetCategories()
      categoriesCache = res.categories || []
      
      // Prefill dropdown of parent categories (only those that are root, meaning parent_id is null)
      parentSelect.innerHTML = '<option value="">Немає (Коренева категорія)</option>' + 
        categoriesCache.filter(c => c.parent_id === null).map(c => `
          <option value="${c.id}">${escapeHtml(c.name)}</option>
        `).join('')

      if (!categoriesCache.length) {
        listBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-500 font-normal">Категорії відсутні в базі даних.</td></tr>`
        return
      }

      listBody.innerHTML = categoriesCache.map(cat => {
        const parent = cat.parent_id ? categoriesCache.find(c => c.id === cat.parent_id) : null;
        const parentName = parent ? parent.name : '—';
        const imgHtml = cat.image 
          ? `<img src="${escapeHtml(cat.image)}" class="w-8 h-8 rounded object-cover border border-slate-200/60 dark:border-white/5" />` 
          : `<div class="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">?</div>`;

        return `
          <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
            <td class="py-3 px-4 text-xs font-mono text-slate-500 font-normal">${cat.id}</td>
            <td class="py-3 px-4">${imgHtml}</td>
            <td class="py-3 px-4 text-sm font-bold text-slate-800 dark:text-slate-200">${escapeHtml(cat.name)}</td>
            <td class="py-3 px-4 text-sm text-slate-500 font-medium">${escapeHtml(parentName)}</td>
            <td class="py-3 px-4 text-sm text-right space-x-2">
              <button type="button" data-edit-cat="${cat.id}" class="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold rounded-lg text-xs transition-colors cursor-pointer">
                Редагувати
              </button>
              <button type="button" data-delete-cat="${cat.id}" class="px-2.5 py-1.5 border border-red-100 text-red-500 hover:bg-red-50 font-bold rounded-lg text-xs transition-colors cursor-pointer">
                Видалити
              </button>
            </td>
          </tr>`
      }).join('')

      // Bind edit action
      listBody.querySelectorAll('[data-edit-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
          const catId = parseInt(btn.getAttribute('data-edit-cat'))
          const cat = categoriesCache.find(c => c.id === catId)
          if (!cat) return

          idField.value = cat.id
          nameInput.value = cat.name
          parentSelect.value = cat.parent_id || ''
          imageInput.value = cat.image || ''
          
          formTitle.textContent = `Редагування категорії #${cat.id}`
          submitBtn.textContent = 'Зберегти зміни'
          formContainer.classList.remove('hidden')
          formContainer.scrollIntoView({ behavior: 'smooth' })
        })
      })

      // Bind delete action
      listBody.querySelectorAll('[data-delete-cat]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const catId = parseInt(btn.getAttribute('data-delete-cat'))
          if (!confirm(`Ви дійсно бажаєте видалити категорію #${catId}? Усі її підкатегорії та товари залишаться без батьківської категорії.`)) {
            return
          }

          try {
            const res = await api.adminCategoryCrud('delete', { id: catId })
            if (res.status === 'success') {
              showToast('Категорію успішно видалено')
              loadCategories()
              if (globalLoadAdminStats) globalLoadAdminStats() // Refresh stats counters!
            } else {
              showToast(res.message || 'Помилка видалення', 'error')
            }
          } catch (err) {
            showToast(err.message || 'Не вдалося видалити категорію', 'error')
          }
        })
      })

    } catch (err) {
      listBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-red-500">Помилка завантаження категорій: ${escapeHtml(err.message)}</td></tr>`
    }
  }

  // Toggle create form
  addCategoryBtn.addEventListener('click', () => {
    form.reset()
    idField.value = ''
    formTitle.textContent = 'Створення категорії'
    submitBtn.textContent = 'Створити категорію'
    formContainer.classList.toggle('hidden')
  })

  cancelBtn.addEventListener('click', () => {
    form.reset()
    idField.value = ''
    formContainer.classList.add('hidden')
  })

  // Submit form
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const name = nameInput.value.trim()
    const parent_id = parentSelect.value
    const image = imageInput.value.trim()
    const catId = idField.value

    const isEdit = catId !== ''
    const action = isEdit ? 'update' : 'create'
    const payload = isEdit ? { id: parseInt(catId), name, parent_id, image } : { name, parent_id, image }

    submitBtn.disabled = true
    submitBtn.textContent = 'Збереження...'

    try {
      const res = await api.adminCategoryCrud(action, payload)
      if (res.status === 'success') {
        showToast(res.message || 'Категорію збережено успішно!')
        form.reset()
        idField.value = ''
        formContainer.classList.add('hidden')
        loadCategories()
        if (globalLoadAdminStats) globalLoadAdminStats() // Refresh statistics
      } else {
        showToast(res.message || 'Помилка збереження', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Не вдалося зберегти категорію', 'error')
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = isEdit ? 'Зберегти зміни' : 'Створити категорію'
    }
  })

  // Load lists on tab binding
  loadCategories()
}

function bindProductSection(container) {
  const addProductBtn = container.querySelector('#add-product-btn')
  const formContainer = container.querySelector('#product-form-container')
  const formTitle = container.querySelector('#product-form-title')
  const form = container.querySelector('#product-crud-form')
  
  const actionTypeField = container.querySelector('#product-action-type')
  const idInput = container.querySelector('#product-id')
  const nameInput = container.querySelector('#product-name')
  const priceInput = container.querySelector('#product-price')
  const categorySelect = container.querySelector('#product-category')
  const availabilitySelect = container.querySelector('#product-availability')
  const sizeInput = container.querySelector('#product-size')
  const stockInput = container.querySelector('#product-stock')
  const weightInput = container.querySelector('#product-weight')
  const supplierInput = container.querySelector('#product-supplier')
  const descTextarea = container.querySelector('#product-description')
  const imageInput = container.querySelector('#product-image')
  const imageFileInput = container.querySelector('#product-image-file')
  
  const cancelBtn = container.querySelector('#product-cancel-btn')
  const submitBtn = container.querySelector('#product-submit-btn')

  // Handle product image uploading via file
  imageFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const labelSpan = imageFileInput.parentElement.querySelector('span')
    const originalText = labelSpan.textContent
    labelSpan.textContent = '...'

    const fd = new FormData()
    fd.append('image', file)

    try {
      const res = await api.uploadImage(fd)
      if (res.status === 'success') {
        imageInput.value = res.url
        showToast('Зображення товару завантажено!')
      } else {
        showToast(res.message || 'Помилка завантаження', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Не вдалося завантажити зображення', 'error')
    } finally {
      labelSpan.textContent = originalText
      imageFileInput.value = ''
    }
  })
  
  const searchInput = container.querySelector('#product-search-input')
  const searchBtn = container.querySelector('#product-search-btn')
  const listBody = container.querySelector('#products-crud-list')

  let productsCache = []

  const loadCategoriesDropdown = async () => {
    try {
      const res = await api.adminGetCategories()
      const list = res.categories || []
      categorySelect.innerHTML = '<option value="">Виберіть категорію</option>' + 
        list.map(c => `
          <option value="${c.id}">${escapeHtml(c.name)}</option>
        `).join('')
    } catch (err) {
      console.error('Failed to load categories for dropdown', err)
    }
  }

  const renderProductsTable = (products) => {
    if (!products.length) {
      listBody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-500 font-normal">Товари не знайдені.</td></tr>`
      return
    }

    listBody.innerHTML = products.map(p => {
      const imgUrl = p.image || p.images?.[0] || 'https://placehold.co/64x64/f1f5f9/94a3b8?text=?'
      const imgHtml = `<img src="${escapeHtml(imgUrl)}" class="w-8 h-8 rounded object-cover border border-slate-200/60 dark:border-white/5" />`
      const isAvailable = p.availability == 1
      const availHtml = isAvailable 
        ? '<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">В наявності</span>' 
        : '<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Немає</span>';

      return `
        <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
          <td class="py-3 px-4 text-xs font-mono text-slate-500 font-normal truncate max-w-[100px]" title="${p.id}">${p.id}</td>
          <td class="py-3 px-4">${imgHtml}</td>
          <td class="py-3 px-4 text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</td>
          <td class="py-3 px-4 text-sm font-extrabold text-indigo-600 dark:text-indigo-400">${formatPrice(p.price)}</td>
          <td class="py-3 px-4">${availHtml}</td>
          <td class="py-3 px-4 text-sm text-right space-x-2">
            <button type="button" data-edit-prod="${p.id}" class="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold rounded-lg text-xs transition-colors cursor-pointer">
              Редагувати
            </button>
            <button type="button" data-delete-prod="${p.id}" class="px-2.5 py-1.5 border border-red-100 text-red-500 hover:bg-red-50 font-bold rounded-lg text-xs transition-colors cursor-pointer">
              Видалити
            </button>
          </td>
        </tr>`
    }).join('')

    // Bind edit product action
    listBody.querySelectorAll('[data-edit-prod]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const prodId = btn.getAttribute('data-edit-prod')
        btn.disabled = true
        btn.textContent = '...'
        try {
          const detail = await api.getProduct(prodId)
          const p = detail.product
          
          actionTypeField.value = 'update'
          idInput.value = p.id
          idInput.disabled = true // SKU cannot be modified on update
          nameInput.value = p.name
          priceInput.value = p.price
          categorySelect.value = p.category_id || ''
          availabilitySelect.value = p.availability ? '1' : '0'
          sizeInput.value = p.size || ''
          stockInput.value = p.quantity_in_stock || '0'
          weightInput.value = p.weight || ''
          supplierInput.value = p.supplier || ''
          descTextarea.value = p.description || ''
          imageInput.value = p.image || p.images?.[0] || ''

          formTitle.textContent = `Редагування товару: ${p.id}`
          submitBtn.textContent = 'Зберегти зміни'
          formContainer.classList.remove('hidden')
          formContainer.scrollIntoView({ behavior: 'smooth' })
        } catch (err) {
          showToast('Не вдалося завантажити деталі товару: ' + err.message, 'error')
        } finally {
          btn.disabled = false
          btn.textContent = 'Редагувати'
        }
      })
    })

    // Bind delete product action
    listBody.querySelectorAll('[data-delete-prod]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const prodId = btn.getAttribute('data-delete-prod')
        if (!confirm(`Ви дійсно бажаєте видалити товар SKU: "${prodId}"? Це видалення остаточне.`)) {
          return
        }

        try {
          const res = await api.adminProductCrud('delete', { id: prodId })
          if (res.status === 'success') {
            showToast('Товар успішно видалено')
            loadInitialProducts()
            if (globalLoadAdminStats) globalLoadAdminStats() // Refresh stats counters!
          } else {
            showToast(res.message || 'Помилка видалення', 'error')
          }
        } catch (err) {
          showToast(err.message || 'Не вдалося видалити товар', 'error')
        }
      })
    })
  }

  const loadInitialProducts = async () => {
    listBody.innerHTML = `<tr><td colspan="6" class="py-8 text-center">${loadingSpinner()}</td></tr>`
    try {
      const data = await api.getProducts(1)
      productsCache = data.products || []
      renderProductsTable(productsCache)
    } catch (err) {
      listBody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-red-500">Помилка завантаження товарів: ${escapeHtml(err.message)}</td></tr>`
    }
  }

  const doSearch = async () => {
    const q = searchInput.value.trim()
    if (!q) {
      loadInitialProducts()
      return
    }

    searchBtn.disabled = true
    searchBtn.textContent = '...'
    listBody.innerHTML = `<tr><td colspan="6" class="py-8 text-center">${loadingSpinner()}</td></tr>`
    try {
      const data = await api.searchProductsAdmin(q)
      renderProductsTable(data.products || [])
    } catch (err) {
      listBody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-red-500">Помилка пошуку: ${escapeHtml(err.message)}</td></tr>`
    } finally {
      searchBtn.disabled = false
      searchBtn.textContent = 'Пошук'
    }
  }

  addProductBtn.addEventListener('click', () => {
    form.reset()
    actionTypeField.value = 'create'
    idInput.disabled = false // Editable on create
    formTitle.textContent = 'Створення товару'
    submitBtn.textContent = 'Створити товар'
    formContainer.classList.toggle('hidden')
  })

  cancelBtn.addEventListener('click', () => {
    form.reset()
    formContainer.classList.add('hidden')
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const id = idInput.value.trim()
    const category_id = categorySelect.value
    const name = nameInput.value.trim()
    const price = parseFloat(priceInput.value)
    const availability = parseInt(availabilitySelect.value)
    const size = sizeInput.value.trim()
    const quantity_in_stock = parseInt(stockInput.value)
    const weight = weightInput.value ? parseFloat(weightInput.value) : ''
    const supplier = supplierInput.value.trim()
    const description = descTextarea.value.trim()
    const image = imageInput.value.trim()

    const action = actionTypeField.value
    const payload = {
      id, category_id, name, price, availability, size, quantity_in_stock, weight, supplier, description, image
    }

    submitBtn.disabled = true
    submitBtn.textContent = 'Збереження...'

    try {
      const res = await api.adminProductCrud(action, payload)
      if (res.status === 'success') {
        showToast(res.message || 'Товар збережено успішно!')
        form.reset()
        formContainer.classList.add('hidden')
        loadInitialProducts()
        if (globalLoadAdminStats) globalLoadAdminStats() // Refresh stats!
      } else {
        showToast(res.message || 'Помилка збереження', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Не вдалося зберегти товар', 'error')
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = action === 'update' ? 'Зберегти зміни' : 'Створити товар'
    }
  })

  searchBtn.addEventListener('click', doSearch)
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch() })

  // Initialize
  loadCategoriesDropdown()
  loadInitialProducts()
}
