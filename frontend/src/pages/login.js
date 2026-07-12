import { api } from '../api/client.js'
import { authStore } from '../store/auth.js'
import { cartStore } from '../store/cart.js'
import { showToast } from '../utils.js'

export function renderLogin() {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-md mx-auto px-4 py-12'

  if (authStore.isLoggedIn()) {
    setTimeout(() => {
      window.history.pushState(null, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, 0)
    return container
  }

  let mode = 'login'
  let pendingEmail = null

  function render() {
    container.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h1 class="text-2xl font-bold text-slate-800 text-center mb-2">
          ${mode === 'login' ? 'Вхід' : mode === 'register' ? 'Реєстрація' : 'Підтвердження email'}
        </h1>
        <p class="text-sm text-slate-500 text-center mb-8">
          ${mode === 'login' ? 'Увійдіть до свого акаунту' : mode === 'register' ? 'Створіть новий акаунт' : 'Введіть код з листа'}
        </p>

        ${mode === 'verify' ? `
          <form id="auth-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Код підтвердження</label>
              <input name="code" required maxlength="6" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest" placeholder="000000" />
            </div>
            <button type="submit" class="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">Підтвердити</button>
          </form>
        ` : `
          <form id="auth-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input name="email" required type="email" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="email@example.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
              <input name="password" required type="password" minlength="6" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Мінімум 6 символів" />
            </div>
            <button type="submit" class="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
              ${mode === 'login' ? 'Увійти' : 'Зареєструватись'}
            </button>
          </form>
        `}

        <div class="mt-6 text-center text-sm">
          ${mode === 'login'
            ? `<span class="text-slate-500">Немає акаунту?</span> <button id="switch-mode" class="text-indigo-600 font-medium hover:text-indigo-700">Зареєструватись</button>`
            : mode === 'register'
              ? `<span class="text-slate-500">Вже є акаунт?</span> <button id="switch-mode" class="text-indigo-600 font-medium hover:text-indigo-700">Увійти</button>`
              : ''
          }
        </div>
      </div>`

    bindEvents()
  }

  function bindEvents() {
    container.querySelector('#switch-mode')?.addEventListener('click', () => {
      mode = mode === 'login' ? 'register' : 'login'
      render()
    })

    container.querySelector('#auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const fd = new FormData(e.target)

      try {
        if (mode === 'verify') {
          const result = await api.verifyEmail(pendingEmail, fd.get('code'))
          if (result.status === 'success') {
            authStore.login(result.token, result.userId, result.isAdmin)
            showToast('Email підтверджено!')
            window.history.pushState(null, '', '/')
            window.dispatchEvent(new PopStateEvent('popstate'))
          } else {
            showToast(result.message || 'Невірний код', 'error')
          }
        } else if (mode === 'login') {
          const result = await api.login(fd.get('email'), fd.get('password'))
          if (result.status === 'success') {
            authStore.login(result.token, result.userId, result.isAdmin)
            showToast('Вітаємо!')
            window.history.pushState(null, '', '/')
            window.dispatchEvent(new PopStateEvent('popstate'))
          } else if (result.status === 'verification_required') {
            pendingEmail = fd.get('email')
            mode = 'verify'
            showToast('Підтвердіть email — код надіслано', 'info')
            render()
          } else {
            showToast(result.message || 'Помилка входу', 'error')
          }
        } else {
          const userId = cartStore.getUserId() || (await cartStore.ensureUserId())
          const result = await api.register(fd.get('email'), fd.get('password'), userId)
          if (result.status === 'success') {
            pendingEmail = fd.get('email')
            mode = 'verify'
            showToast('Перевірте email для підтвердження')
            render()
          } else {
            showToast(result.message || 'Помилка реєстрації', 'error')
          }
        }
      } catch (err) {
        showToast(err.message || 'Помилка', 'error')
      }
    })
  }

  render()
  return container
}
