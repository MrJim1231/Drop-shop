import { api } from '../api/client.js'
import { cartStore } from '../store/cart.js'
import { formatPrice, escapeHtml, showToast } from '../utils.js'

export function renderCart() {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'

  const items = cartStore.getItems()
  const total = cartStore.getTotal()

  if (!items.length) {
    container.innerHTML = `
      <div class="text-center py-20">
        <div class="text-6xl mb-4">🛒</div>
        <h1 class="text-2xl font-bold text-slate-800">Кошик порожній</h1>
        <p class="text-slate-500 mt-2 mb-8">Додайте товари з каталогу</p>
        <a href="/categories" class="inline-flex px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          Перейти до каталогу
        </a>
      </div>`
    return container
  }

  container.innerHTML = `
    <h1 class="text-3xl font-bold text-slate-800 mb-8">Кошик</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-4" id="cart-items">
        ${items.map((item) => cartItemHtml(item)).join('')}
      </div>

      <div class="lg:col-span-1">
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
          <h2 class="font-semibold text-slate-800 mb-4">Підсумок</h2>
          <div class="flex justify-between text-slate-600 mb-2">
            <span>Товарів:</span>
            <span>${items.reduce((s, i) => s + i.quantity, 0)} шт.</span>
          </div>
          <div class="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-4 mt-4">
            <span>Разом:</span>
            <span id="cart-total">${formatPrice(total)}</span>
          </div>

          <form id="checkout-form" class="mt-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Ім'я *</label>
              <input name="name" required class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Ваше ім'я" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Телефон *</label>
              <input name="phone" required type="tel" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="+380..." />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input name="email" required type="email" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="email@example.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Адреса доставки *</label>
              <textarea name="address" required rows="2" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" placeholder="Місто, відділення Нової Пошти"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Коментар</label>
              <textarea name="comment" rows="2" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" placeholder="Необов'язково"></textarea>
            </div>
            <button type="submit" id="checkout-btn" class="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
              Оформити замовлення
            </button>
          </form>
        </div>
      </div>
    </div>`

  bindCartEvents(container)
  return container
}

function cartItemHtml(item) {
  const image = item.image || 'https://placehold.co/100x100/f1f5f9/94a3b8?text=?'
  return `
    <div class="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4" data-cart-id="${item.id}">
      <img src="${escapeHtml(image)}" alt="" class="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-slate-100" />
      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-slate-800 truncate">${escapeHtml(item.name)}</h3>
        ${item.size && item.size !== '—' ? `<p class="text-xs text-slate-500 mt-0.5">${escapeHtml(item.size)}</p>` : ''}
        <p class="text-indigo-600 font-semibold mt-1">${formatPrice(item.price)}</p>
        <div class="flex items-center gap-3 mt-2">
          <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden text-sm">
            <button class="qty-dec px-3 py-1 hover:bg-slate-50">−</button>
            <span class="qty-val px-3 py-1 border-x border-slate-200 min-w-[2rem] text-center">${item.quantity}</span>
            <button class="qty-inc px-3 py-1 hover:bg-slate-50">+</button>
          </div>
          <button class="remove-btn text-sm text-red-500 hover:text-red-700">Видалити</button>
        </div>
      </div>
      <p class="font-bold text-slate-800 flex-shrink-0">${formatPrice(item.price * item.quantity)}</p>
    </div>`
}

function bindCartEvents(container) {
  container.querySelectorAll('[data-cart-id]').forEach((row) => {
    const id = row.dataset.cartId

    row.querySelector('.qty-dec')?.addEventListener('click', () => {
      const item = cartStore.getItems().find((i) => i.id === id)
      if (item) {
        cartStore.updateQuantity(id, item.quantity - 1)
        rerenderCart()
      }
    })

    row.querySelector('.qty-inc')?.addEventListener('click', () => {
      const item = cartStore.getItems().find((i) => i.id === id)
      if (item) {
        cartStore.updateQuantity(id, item.quantity + 1)
        rerenderCart()
      }
    })

    row.querySelector('.remove-btn')?.addEventListener('click', () => {
      cartStore.removeItem(id)
      showToast('Товар видалено', 'info')
      rerenderCart()
    })
  })

  container.querySelector('#checkout-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = container.querySelector('#checkout-btn')
    const form = e.target
    const fd = new FormData(form)

    btn.disabled = true
    btn.textContent = 'Оформлення...'

    try {
      const userId = await cartStore.ensureUserId()
      const items = cartStore.getItems()

      const result = await api.createOrder({
        name: fd.get('name'),
        phone: fd.get('phone'),
        email: fd.get('email'),
        address: fd.get('address'),
        comment: fd.get('comment') || '',
        items: items.map((i) => ({
          product_id: i.product_id || i.id,
          quantity: i.quantity,
          price: i.price,
          image: i.image,
          size: i.size,
          rubber: i.rubber || false,
        })),
        totalPrice: cartStore.getTotal(),
        userId,
      })

      if (result.status === 'success') {
        cartStore.clear()
        cartStore.setUserId(result.userId)
        showToast('Замовлення оформлено! Перевірте email.')
        window.history.pushState(null, '', '/orders')
        window.dispatchEvent(new PopStateEvent('popstate'))
      } else {
        showToast(result.message || 'Помилка оформлення', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Помилка оформлення замовлення', 'error')
    } finally {
      btn.disabled = false
      btn.textContent = 'Оформити замовлення'
    }
  })
}

function rerenderCart() {
  window.dispatchEvent(new PopStateEvent('popstate'))
}
