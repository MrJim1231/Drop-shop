export function formatPrice(price) {
  const num = parseFloat(price)
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

export function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text ?? ''
  return div.innerHTML
}

export function stripHtml(html) {
  const div = document.createElement('div')
  div.innerHTML = html ?? ''
  return div.textContent || div.innerText || ''
}

export function showToast(message, type = 'success') {
  const existing = document.getElementById('toast')
  if (existing) existing.remove()

  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-indigo-600',
  }

  const toast = document.createElement('div')
  toast.id = 'toast'
  toast.className = `fixed bottom-6 right-6 z-50 ${colors[type]} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-[fade-in_0.2s_ease-out]`
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => toast.remove(), 3000)
}

export function loadingSpinner() {
  return `<div class="flex justify-center py-16">
    <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>`
}

export function productCard(product, linkPrefix = '/product/') {
  const image =
    product.images?.[0] ||
    product.image ||
    'https://placehold.co/400x400/f1f5f9/94a3b8?text=Немає+фото'
  const available = product.availability == 1 || product.availability === true

  return `
    <a href="${linkPrefix}${product.id}" class="product-card group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
      <div class="aspect-square overflow-hidden bg-slate-100 relative">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" class="product-image w-full h-full object-cover" loading="lazy" />
        ${!available ? '<span class="absolute top-3 left-3 bg-slate-800/80 text-white text-xs px-2 py-1 rounded-full">Немає в наявності</span>' : ''}
      </div>
      <div class="p-4">
        <h3 class="font-medium text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">${escapeHtml(product.name)}</h3>
        ${product.size ? `<p class="text-xs text-slate-500 mt-1">${escapeHtml(product.size)}</p>` : ''}
        <p class="text-lg font-bold text-indigo-600 mt-2">${formatPrice(product.price)}</p>
      </div>
    </a>`
}
