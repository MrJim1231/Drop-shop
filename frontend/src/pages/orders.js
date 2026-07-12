import { api } from '../api/client.js'
import { authStore } from '../store/auth.js'
import { cartStore } from '../store/cart.js'
import { formatPrice, escapeHtml, loadingSpinner } from '../utils.js'

export async function renderOrders() {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'

  const userId = authStore.getUserId() || cartStore.getUserId()

  if (!userId) {
    container.innerHTML = `
      <div class="text-center py-20">
        <h1 class="text-2xl font-bold text-slate-800">Мої замовлення</h1>
        <p class="text-slate-500 mt-2 mb-8">Оформіть замовлення, щоб побачити його тут</p>
        <a href="#/categories" class="inline-flex px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          Перейти до каталогу
        </a>
      </div>`
    return container
  }

  container.innerHTML = `
    <h1 class="text-3xl font-bold text-slate-800 mb-8">Мої замовлення</h1>
    <div id="orders-list">${loadingSpinner()}</div>`

  try {
    const orders = await api.getOrders(userId)
    const list = container.querySelector('#orders-list')

    if (!Array.isArray(orders) || orders.status === 'error') {
      list.innerHTML = `<p class="text-center text-slate-500 py-16">${orders.message || 'Замовлень поки немає'}</p>`
      return container
    }

    if (!orders.length) {
      list.innerHTML = `<p class="text-center text-slate-500 py-16">Замовлень поки немає</p>`
      return container
    }

    list.innerHTML = `<div class="space-y-6">
      ${orders.map((order) => `
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="font-semibold text-slate-800">Замовлення ${escapeHtml(order.order_number)}</p>
              <p class="text-sm text-slate-500">${new Date(order.created_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <p class="text-lg font-bold text-indigo-600">${formatPrice(order.total_price)}</p>
          </div>
          <div class="p-6">
            <div class="text-sm text-slate-600 space-y-1 mb-4">
              <p><span class="font-medium">Ім'я:</span> ${escapeHtml(order.name)}</p>
              <p><span class="font-medium">Телефон:</span> ${escapeHtml(order.phone)}</p>
              <p><span class="font-medium">Адреса:</span> ${escapeHtml(order.address)}</p>
            </div>
            ${order.items?.length ? `
              <div class="border-t border-slate-100 pt-4 space-y-3">
                ${order.items.map((item) => `
                  <div class="flex items-center gap-3 text-sm">
                    ${item.image ? `<img src="${escapeHtml(item.image)}" alt="" class="w-12 h-12 rounded-lg object-cover bg-slate-100" />` : ''}
                    <div class="flex-1">
                      <p class="font-medium text-slate-800">${escapeHtml(item.name)}</p>
                      <p class="text-slate-500">${item.quantity} шт. × ${formatPrice(item.price)}</p>
                    </div>
                  </div>
                `).join('')}
              </div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>`
  } catch {
    container.querySelector('#orders-list').innerHTML =
      `<p class="text-center text-slate-500 py-16">Не вдалося завантажити замовлення</p>`
  }

  return container
}
