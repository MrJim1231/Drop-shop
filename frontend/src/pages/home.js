import { api } from '../api/client.js'
import { productCard, loadingSpinner, escapeHtml, slugify } from '../utils.js'

export async function renderHome() {
  const container = document.createElement('div')
  container.className = 'page-enter'

  const slides = [
    {
      image: '/electronics_banner.png',
      title: 'Світ передової електроніки',
      subtitle: 'Відкрийте для себе найсучасніші смартфони, навушники та смарт-гаджети за найкращими цінами.',
      link: '/categories',
      btnText: 'Перейти до каталогу'
    },
    {
      image: '/accessories_banner.png',
      title: 'Преміальні аксесуари',
      subtitle: 'Створіть свій неповторний образ із нашою колекцією годинників, окулярів та шкіряних виробів.',
      link: '/categories',
      btnText: 'Обрати стиль'
    },
    {
      image: '/home_banner.png',
      title: 'Розумний та затишний дім',
      subtitle: 'Інноваційні гаджети та побутова техніка для комфортного повсякденного життя.',
      link: '/categories',
      btnText: 'Дивитись товари'
    }
  ]

  container.innerHTML = `
    <!-- Головний баннер / Слайдер -->
    <section class="relative overflow-hidden bg-slate-950 group">
      <div id="home-slider-container" class="relative h-[380px] sm:h-[450px] md:h-[500px] w-full flex transition-transform duration-700 ease-in-out" style="width: 300%; transform: translateX(0%);">
        ${slides.map((s, idx) => `
          <div class="w-1/3 h-full relative flex-shrink-0 bg-cover bg-center select-none" style="background-image: url('${s.image}')">
            <!-- Dark gradient overlay for readability -->
            <div class="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/65 to-transparent"></div>
            
            <div class="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center z-10">
              <div class="max-w-2xl transform translate-y-4 opacity-0 transition-all duration-700 ease-out slide-content">
                <span class="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-6 uppercase tracking-wider">Ексклюзивна колекція</span>
                <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">${s.title}</h1>
                <p class="mt-4 text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed font-normal">${s.subtitle}</p>
                <div class="mt-8 flex flex-wrap gap-4">
                  <a href="${s.link}" class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-600/35">
                    ${s.btnText}
                  </a>
                  <a href="/categories" class="inline-flex items-center px-6 py-3 border border-white/20 text-white hover:bg-white/10 font-semibold rounded-xl transition-all duration-200 backdrop-blur-sm">
                    Каталог
                  </a>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Navigation Arrows -->
      <button id="slider-prev" class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-slate-900/60 hover:bg-slate-950 text-white flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 z-20 cursor-pointer">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button id="slider-next" class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-slate-900/60 hover:bg-slate-950 text-white flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 z-20 cursor-pointer">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
      </button>

      <!-- Indicator Dots -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        ${slides.map((_, idx) => `
          <button data-slide-to="${idx}" class="slider-dot w-2.5 h-2.5 rounded-full bg-white/40 hover:bg-white transition-all duration-300 cursor-pointer" aria-label="Перейти до слайду ${idx + 1}"></button>
        `).join('')}
      </div>
    </section>

    <!-- Блок категорій сіткою -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-slate-800">Категорії</h2>
        <a href="/categories" class="text-sm font-medium text-indigo-600 hover:text-indigo-700">Всі категорії →</a>
      </div>
      <div id="home-categories">${loadingSpinner()}</div>
    </section>

    <!-- Популярні товари -->
    <section class="bg-white border-y border-slate-200/60">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 class="text-2xl font-bold text-slate-800 mb-8">Популярні товари</h2>
        <div id="home-products">${loadingSpinner()}</div>
      </div>
    </section>

    <!-- Додатковий Hero / Промо блок -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="relative rounded-3xl overflow-hidden shadow-2xl group">
        <div class="absolute inset-0 bg-gradient-to-br from-violet-900 via-indigo-800 to-blue-900"></div>
        <img src="/electronics_banner.png" class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 group-hover:scale-105 transition-transform duration-700 ease-in-out" alt="Promo background">
        <div class="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent"></div>
        <div class="relative z-10 px-8 py-16 sm:px-16 sm:py-24 lg:w-2/3">
          <span class="inline-flex items-center px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-full mb-6 tracking-wider uppercase backdrop-blur-md border border-white/20">
            <span class="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
            Супер пропозиція
          </span>
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight drop-shadow-md">Знижки до -50% на техніку та аксесуари</h2>
          <p class="text-lg text-indigo-100 mb-8 max-w-xl leading-relaxed drop-shadow-sm">Оновіть свій арсенал гаджетів з нашими найкращими товарами. Акція діє лише до кінця тижня. Не проґавте свій шанс отримати преміальну якість за вигідною ціною!</p>
          <a href="/categories" class="inline-flex items-center px-6 py-3.5 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 hover:scale-105 transition-all duration-300 shadow-xl shadow-black/20">
            Переглянути акції
            <svg class="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      </div>
    </section>

    <!-- Переваги магазину -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white rounded-2xl border border-slate-200/60 p-8 text-center hover:shadow-lg hover:border-slate-300 transition-all duration-300">
          <div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">🚚</div>
          <h3 class="font-bold text-slate-800 text-lg">Швидка доставка</h3>
          <p class="text-sm text-slate-500 mt-2 leading-relaxed">Відправляємо замовлення протягом 1–3 робочих днів по всій території України.</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200/60 p-8 text-center hover:shadow-lg hover:border-slate-300 transition-all duration-300">
          <div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">✅</div>
          <h3 class="font-bold text-slate-800 text-lg">Гарантія якості</h3>
          <p class="text-sm text-slate-500 mt-2 leading-relaxed">Тільки оригінальні та перевірені товари від надійних світових виробників.</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200/60 p-8 text-center hover:shadow-lg hover:border-slate-300 transition-all duration-300">
          <div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">💬</div>
          <h3 class="font-bold text-slate-800 text-lg">Підтримка 24/7</h3>
          <p class="text-sm text-slate-500 mt-2 leading-relaxed">Наші консультанти завжди готові допомогти вам з вибором та оформленням замовлення.</p>
        </div>
      </div>
    </section>
  `

  // Slider Logic implementation
  let currentSlide = 0
  const totalSlides = slides.length

  const updateSlider = () => {
    const sliderContainer = container.querySelector('#home-slider-container')
    const dots = container.querySelectorAll('.slider-dot')
    const contents = container.querySelectorAll('.slide-content')
    
    if (!sliderContainer) return
    
    sliderContainer.style.transform = `translateX(-${(currentSlide * 100) / totalSlides}%)`
    
    dots.forEach((dot, idx) => {
      if (idx === currentSlide) {
        dot.classList.remove('bg-white/40', 'w-2.5')
        dot.classList.add('bg-white', 'w-8')
      } else {
        dot.classList.remove('bg-white', 'w-8')
        dot.classList.add('bg-white/40', 'w-2.5')
      }
    })

    contents.forEach((content, idx) => {
      if (idx === currentSlide) {
        content.classList.remove('translate-y-4', 'opacity-0')
        content.classList.add('translate-y-0', 'opacity-100')
      } else {
        content.classList.remove('translate-y-0', 'opacity-100')
        content.classList.add('translate-y-4', 'opacity-0')
      }
    })
  }

  let interval = setInterval(() => {
    currentSlide = (currentSlide + 1) % totalSlides
    updateSlider()
  }, 6000)

  const resetInterval = () => {
    clearInterval(interval)
    interval = setInterval(() => {
      currentSlide = (currentSlide + 1) % totalSlides
      updateSlider()
    }, 6000)
  }

  container.querySelector('#slider-prev')?.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides
    updateSlider()
    resetInterval()
  })

  container.querySelector('#slider-next')?.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % totalSlides
    updateSlider()
    resetInterval()
  })

  container.querySelectorAll('.slider-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      currentSlide = parseInt(dot.dataset.slideTo)
      updateSlider()
      resetInterval()
    })
  })

  // Start slider initial animation
  setTimeout(updateSlider, 50)

  loadCategories(container)
  loadProducts(container)

  return container
}

async function loadCategories(container) {
  const el = container.querySelector('#home-categories')
  try {
    const allCategories = await api.getCategories()
    const rootIds = [1000001, 1000002, 1000003, 1000004, 1000005, 1000006, 1000007, 1000008, 1000009, 1000010, 1000011, 1000012, 1000013, 1000014, 1000015, 1000016, 1000017, 1000018, 1000019, 1000020]
    let categories = allCategories.filter(c => rootIds.includes(Number(c.id)))
    if (categories.length === 0) {
      categories = allCategories
    }
    const top = categories.slice(0, 8)
    el.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      ${top.map((cat) => `
        <a href="/category/${cat.id}-${slugify(cat.name)}" class="group bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
          <div class="aspect-[4/3] bg-slate-50 overflow-hidden relative">
            <img src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" loading="lazy"
              onerror="this.src='https://placehold.co/400x300/f1f5f9/94a3b8?text=${encodeURIComponent(cat.name)}'" />
          </div>
          <p class="p-4 text-sm font-semibold text-slate-800 text-center group-hover:text-indigo-600 transition-colors">${escapeHtml(cat.name)}</p>
        </a>
      `).join('')}
    </div>`
  } catch (err) {
    el.innerHTML = `<p class="text-center text-slate-500 py-8">Не вдалося завантажити категорії. Перевірте підключення до бекенду.</p>`
  }
}

async function loadProducts(container) {
  const el = container.querySelector('#home-products')
  try {
    const data = await api.getProducts(1)
    const products = data.products?.slice(0, 8) || []

    if (products.length === 0) {
      el.innerHTML = `<p class="text-center text-slate-500 py-8">Товари ще не додані. Запустіть импорт на бекенді.</p>`
      return
    }

    el.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 stagger-grid">
      ${products.map((p) => productCard(p)).join('')}
    </div>`
  } catch {
    el.innerHTML = `<p class="text-center text-slate-500 py-8">Не вдалося завантажити товари.</p>`
  }
}
