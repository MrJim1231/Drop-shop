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

export function slugify(text) {
  if (!text) return ''
  const translit = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh',
    'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
    'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ye', 'Ж': 'Zh',
    'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F',
    'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '', 'Ю': 'Yu', 'Я': 'Ya',
    'ё': 'yo', 'Ё': 'Yo', 'ы': 'y', 'Ы': 'Y', 'э': 'e', 'Э': 'E', 'ъ': '', 'Ъ': '', 'і': 'i', 'І': 'I',
    'ґ': 'g', 'Ґ': 'G'
  }

  let slug = text
    .toString()
    .split('')
    .map(char => translit[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Truncate to maximum 70 characters to avoid overly long URLs
  if (slug.length > 70) {
    slug = slug.substring(0, 70)
    const lastDash = slug.lastIndexOf('-')
    if (lastDash > 30) {
      slug = slug.substring(0, lastDash)
    }
  }

  return slug
}

export function productCard(product, linkPrefix = '/product/') {
  const image =
    product.images?.[0] ||
    product.image ||
    'https://placehold.co/400x400/f1f5f9/94a3b8?text=Немає+фото'
  const available = product.availability == 1 || product.availability === true
  const slug = slugify(product.name)
  const href = `${linkPrefix}${product.id}${slug ? '-' + slug : ''}`

  const discount = parseInt(product.discount) || 0
  const hasDiscount = discount > 0 && product.discounted_price != null
  const displayPrice = hasDiscount ? product.discounted_price : product.price

  const priceHtml = hasDiscount
    ? `<div class="flex items-baseline gap-2 mt-2 flex-wrap">
        <p class="text-lg font-bold text-rose-600">${formatPrice(displayPrice)}</p>
        <p class="text-sm text-slate-400 line-through font-normal">${formatPrice(product.price)}</p>
        <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-600">-${discount}%</span>
      </div>`
    : `<p class="text-lg font-bold text-indigo-600 mt-2">${formatPrice(product.price)}</p>`

  return `
    <a href="${href}" class="product-card group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
      <div class="aspect-square overflow-hidden bg-slate-100 relative">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" class="product-image w-full h-full object-cover" loading="lazy" />
        ${!available ? '<span class="absolute top-3 left-3 bg-slate-800/80 text-white text-xs px-2 py-1 rounded-full">Немає в наявності</span>' : ''}
        ${hasDiscount ? `<span class="absolute top-3 right-3 bg-rose-600 text-white text-xs font-black px-2 py-1 rounded-full shadow-md">-${discount}%</span>` : ''}
      </div>
      <div class="p-4">
        <h3 class="font-medium text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">${escapeHtml(product.name)}</h3>
        ${product.size ? `<p class="text-xs text-slate-500 mt-1">${escapeHtml(product.size)}</p>` : ''}
        ${priceHtml}
      </div>
    </a>`
}
