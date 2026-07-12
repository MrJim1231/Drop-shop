import { api } from '../api/client.js'
import { cartStore } from '../store/cart.js'
import { formatPrice, escapeHtml, stripHtml, loadingSpinner, showToast, slugify } from '../utils.js'

export async function renderProductDetail(productId) {
  const container = document.createElement('div')
  container.className = 'page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
  container.innerHTML = loadingSpinner()

  try {
    const product = await api.getProduct(productId)
    const images = product.images?.length
      ? product.images
      : ['https://placehold.co/600x600/f1f5f9/94a3b8?text=Немає+фото']

    const sizes = flattenSizes(product.sizes)
    const available = product.availability == 1

    container.innerHTML = `
      <nav class="text-sm text-slate-500 mb-6">
        <a href="/" class="hover:text-indigo-600">Головна</a>
        <span class="mx-2">/</span>
        <a href="/categories" class="hover:text-indigo-600">Каталог</a>
        ${product.category_id ? `<span class="mx-2">/</span><a href="/category/${product.category_id}-${slugify(product.category_name || '')}" class="hover:text-indigo-600">${escapeHtml(product.category_name || '')}</a>` : ''}
        <span class="mx-2">/</span>
        <span class="text-slate-800">${escapeHtml(product.name)}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div class="aspect-square bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4">
            <img id="main-image" src="${escapeHtml(images[0])}" alt="${escapeHtml(product.name)}" class="w-full h-full object-contain p-4" />
          </div>
          ${images.length > 1 ? `
            <div class="flex gap-2 overflow-x-auto pb-2">
              ${images.map((img, i) => `
                <button data-image="${escapeHtml(img)}" class="thumb-btn flex-shrink-0 w-20 h-20 rounded-xl border-2 ${i === 0 ? 'border-indigo-600' : 'border-slate-200'} overflow-hidden hover:border-indigo-400 transition-colors">
                  <img src="${escapeHtml(img)}" alt="" class="w-full h-full object-cover" />
                </button>
              `).join('')}
            </div>` : ''}
        </div>

        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-slate-800">${escapeHtml(product.name)}</h1>
          ${product.category_name ? `<p class="text-sm text-indigo-600 mt-2">${escapeHtml(product.category_name)}</p>` : ''}

          <p class="text-3xl font-bold text-indigo-600 mt-6" id="product-price">${formatPrice(product.price)}</p>

          <div class="mt-4 flex items-center gap-3">
            ${available
              ? `<span class="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium"><span class="w-2 h-2 bg-emerald-500 rounded-full"></span> В наявності</span>`
              : `<span class="inline-flex items-center gap-1 text-sm text-red-600 font-medium"><span class="w-2 h-2 bg-red-500 rounded-full"></span> Немає в наявності</span>`
            }
            ${product.quantity_in_stock > 0 ? `<span class="text-sm text-slate-500">Залишок: ${product.quantity_in_stock} шт.</span>` : ''}
          </div>

          ${sizes.length > 1 ? `
            <div class="mt-6">
              <label class="block text-sm font-medium text-slate-700 mb-2">Розмір / варіант</label>
              <div class="flex flex-wrap gap-2" id="size-options">
                ${sizes.map((s, i) => `
                  <button data-size-id="${s.id}" data-size="${escapeHtml(s.size)}" data-price="${s.price}"
                    class="size-btn px-4 py-2 rounded-xl border text-sm font-medium transition-colors
                      ${s.id == productId ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-700 hover:border-indigo-300'}
                      ${s.availability != 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${s.availability != 1 ? 'disabled' : ''}>
                    ${escapeHtml(s.size || 'Стандарт')}
                  </button>
                `).join('')}
              </div>
            </div>` : ''}

          <div class="mt-6 flex items-center gap-4">
            <div class="flex items-center border border-slate-200 rounded-xl overflow-hidden">
              <button id="qty-minus" class="px-4 py-3 hover:bg-slate-50 text-slate-600 font-bold">−</button>
              <input id="qty-input" type="number" value="1" min="1" max="99" class="w-16 text-center py-3 border-x border-slate-200 focus:outline-none" />
              <button id="qty-plus" class="px-4 py-3 hover:bg-slate-50 text-slate-600 font-bold">+</button>
            </div>
            <button id="add-to-cart" class="flex-1 py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              ${!available ? 'disabled' : ''}>
              Додати в кошик
            </button>
          </div>

          ${product.description ? `
            <div class="mt-8 border-t border-slate-200 pt-8">
              <h2 class="font-semibold text-slate-800 mb-3">Опис товару</h2>
              <div class="text-sm text-slate-600 leading-relaxed whitespace-pre-line">${escapeHtml(stripHtml(product.description))}</div>
            </div>` : ''}
        </div>
      </div>`

    bindProductEvents(container, product, images, sizes)
  } catch {
    container.innerHTML = `
      <div class="text-center py-16">
        <p class="text-slate-500 mb-4">Товар не знайдено</p>
        <a href="/categories" class="text-indigo-600 hover:text-indigo-700 font-medium">← Повернутись до каталогу</a>
      </div>`
  }

  return container
}

function flattenSizes(sizesObj) {
  if (!sizesObj || typeof sizesObj !== 'object') return []
  const result = []
  for (const group of Object.values(sizesObj)) {
    if (Array.isArray(group)) result.push(...group)
  }
  return result
}

function bindProductEvents(container, product, images, sizes) {
  let selectedId = product.id
  let selectedPrice = product.price
  let selectedSize = product.size || '—'
  let selectedImage = images[0]

  container.querySelectorAll('.thumb-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const img = btn.dataset.image
      container.querySelector('#main-image').src = img
      container.querySelectorAll('.thumb-btn').forEach((b) => {
        b.classList.remove('border-indigo-600')
        b.classList.add('border-slate-200')
      })
      btn.classList.remove('border-slate-200')
      btn.classList.add('border-indigo-600')
    })
  })

  container.querySelectorAll('.size-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedId = btn.dataset.sizeId
      selectedPrice = btn.dataset.price
      selectedSize = btn.dataset.size
      container.querySelector('#product-price').textContent = formatPrice(selectedPrice)
      container.querySelectorAll('.size-btn').forEach((b) => {
        b.classList.remove('border-indigo-600', 'bg-indigo-50', 'text-indigo-700')
        b.classList.add('border-slate-200', 'text-slate-700')
      })
      btn.classList.remove('border-slate-200', 'text-slate-700')
      btn.classList.add('border-indigo-600', 'bg-indigo-50', 'text-indigo-700')
    })
  })

  const qtyInput = container.querySelector('#qty-input')
  container.querySelector('#qty-minus')?.addEventListener('click', () => {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1)
  })
  container.querySelector('#qty-plus')?.addEventListener('click', () => {
    qtyInput.value = Math.min(99, parseInt(qtyInput.value) + 1)
  })

  container.querySelector('#add-to-cart')?.addEventListener('click', () => {
    cartStore.addItem({
      id: selectedId,
      name: product.name,
      price: selectedPrice,
      image: selectedImage,
      size: selectedSize,
      quantity: parseInt(qtyInput.value) || 1,
    })
    showToast('Товар додано в кошик')
  })
}
