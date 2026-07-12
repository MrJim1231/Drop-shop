import { authStore } from '../store/auth.js'
import { api } from '../api/client.js'
import { showToast, loadingSpinner, escapeHtml } from '../utils.js'

export async function renderProfile() {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-2xl mx-auto px-4 py-8'

  const userId = authStore.getUserId()

  if (!authStore.isLoggedIn() || !userId) {
    container.innerHTML = `
      <div class="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div class="text-6xl mb-4">🔒</div>
        <h1 class="text-2xl font-bold text-slate-800">Доступ обмежено</h1>
        <p class="text-slate-500 mt-2 mb-8">Будь ласка, увійдіть у свій акаунт, щоб переглянути профіль</p>
        <a href="/login" class="inline-flex px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
          Увійти
        </a>
      </div>`
    return container
  }

  container.innerHTML = `
    <div class="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
      <h1 class="text-3xl font-bold text-slate-800 mb-2">Мій профіль</h1>
      <p class="text-slate-500 mb-8">Керуйте своїми персональними даними для швидкого оформлення замовлень</p>

      <div id="profile-loader" class="py-12">
        ${loadingSpinner()}
      </div>

      <form id="profile-form" class="space-y-6 hidden">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Email</label>
          <input type="email" id="profile-email" disabled
            class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-none" />
          <p class="text-xs text-slate-400 mt-1.5">Email адресу не можна змінити, оскільки вона прив'язана до вашого акаунту</p>
        </div>

        <div>
          <label for="profile-name" class="block text-sm font-medium text-slate-700 mb-2">Ім'я та Прізвище</label>
          <input type="text" id="profile-name" name="name" placeholder="Введіть ваше ім'я"
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" />
        </div>

        <div>
          <label for="profile-phone" class="block text-sm font-medium text-slate-700 mb-2">Телефон</label>
          <input type="tel" id="profile-phone" name="phone" placeholder="+380"
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" />
        </div>

        <div>
          <label for="profile-address" class="block text-sm font-medium text-slate-700 mb-2">Адреса доставки</label>
          <textarea id="profile-address" name="address" rows="3" placeholder="Місто, відділення Нової Пошти або адреса"
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"></textarea>
        </div>

        <button type="submit" id="save-profile-btn"
          class="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
          Зберегти зміни
        </button>
      </form>
    </div>`

  const form = container.querySelector('#profile-form')
  const loader = container.querySelector('#profile-loader')

  try {
    const response = await api.getProfile(userId)
    if (response.status === 'success' && response.data) {
      const user = response.data
      container.querySelector('#profile-email').value = user.email || ''
      container.querySelector('#profile-name').value = user.name || ''
      container.querySelector('#profile-phone').value = user.phone || ''
      container.querySelector('#profile-address').value = user.address || ''

      loader.classList.add('hidden')
      form.classList.remove('hidden')
    } else {
      showToast(response.message || 'Не вдалося завантажити профіль', 'error')
    }
  } catch (err) {
    showToast(err.message || 'Помилка завантаження даних', 'error')
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = form.querySelector('#save-profile-btn')
    const originalText = btn.textContent

    btn.disabled = true
    btn.innerHTML = `
      <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      Збереження...`

    const fd = new FormData(form)

    try {
      const result = await api.updateProfile({
        userId,
        name: fd.get('name'),
        phone: fd.get('phone'),
        address: fd.get('address'),
      })

      if (result.status === 'success') {
        showToast('Профіль успішно оновлено!')
      } else {
        showToast(result.message || 'Помилка оновлення', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Не вдалося оновити профіль', 'error')
    } finally {
      btn.disabled = false
      btn.textContent = originalText
    }
  })

  return container
}
