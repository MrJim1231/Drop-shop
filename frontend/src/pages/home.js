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
    <!-- Головний баннер / Слайдер (Asymmetrical) -->
    <section class="relative overflow-hidden bg-slate-50 group border-b border-slate-200/60">
      <div id="home-slider-container" class="relative h-[500px] sm:h-[550px] md:h-[650px] w-full flex transition-transform duration-700 ease-in-out" style="width: 300%; transform: translateX(0%);">
        ${slides.map((s, idx) => `
          <div class="w-1/3 h-full relative flex-shrink-0 flex items-center overflow-hidden bg-slate-50">
            
            <!-- Asymmetrical Image (Right Side) -->
            <div class="absolute top-0 right-0 w-[85%] md:w-[65%] h-full z-0 transition-transform duration-1000 ease-in-out transform scale-105 group-hover:scale-100" style="clip-path: polygon(15% 0, 100% 0, 100% 100%, 0% 100%);">
              <div class="absolute inset-0 bg-indigo-900/10 mix-blend-multiply z-10"></div>
              <img src="${s.image}" class="w-full h-full object-cover object-center" alt="${s.title}" />
            </div>

            <!-- Content Card (Left Side) -->
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20 flex">
              <div class="w-full md:w-[55%] lg:w-[45%] transform translate-y-8 opacity-0 transition-all duration-700 ease-out slide-content">
                <div class="bg-white/80 backdrop-blur-2xl p-8 sm:p-12 rounded-[2rem] shadow-2xl border border-white/80 relative overflow-hidden">
                  
                  <!-- Decorative blur effects inside card -->
                  <div class="absolute -top-10 -right-10 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
                  <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
                  
                  <div class="relative z-10">
                    <span class="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 mb-6 uppercase tracking-widest shadow-sm border border-indigo-200">✨ Нова колекція</span>
                    <h1 class="text-4xl sm:text-5xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight mb-5">${s.title}</h1>
                    <p class="text-base sm:text-lg text-slate-600 leading-relaxed font-medium mb-8">${s.subtitle}</p>
                    <div class="flex flex-wrap gap-4">
                      <a href="${s.link}" class="inline-flex items-center px-7 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all duration-300 shadow-xl shadow-slate-900/20 hover:-translate-y-1">
                        ${s.btnText}
                      </a>
                      <a href="/categories" class="inline-flex items-center px-7 py-3.5 bg-white text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all duration-300 shadow-sm border border-slate-200 hover:-translate-y-1">
                        Каталог
                      </a>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        `).join('')}
      </div>

      <!-- Navigation Arrows -->
      <button id="slider-prev" class="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-slate-800 flex items-center justify-center border border-slate-200 shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 z-30 cursor-pointer hover:scale-110">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button id="slider-next" class="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-slate-800 flex items-center justify-center border border-slate-200 shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 z-30 cursor-pointer hover:scale-110">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
      </button>

      <!-- Indicator Dots -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        ${slides.map((_, idx) => `
          <button data-slide-to="${idx}" class="slider-dot w-2.5 h-2.5 rounded-full bg-slate-300 hover:bg-indigo-600 transition-all duration-300 cursor-pointer shadow-sm" aria-label="Перейти до слайду ${idx + 1}"></button>
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

    <!-- Дві промо-картки на всю ширину фону -->
    <section class="w-full bg-slate-50 py-12 md:py-16 border-t border-slate-200/60">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          <!-- Картка 1 -->
          <div class="relative rounded-3xl overflow-hidden shadow-xl group h-72 sm:h-80 md:h-[350px]">
            <img src="/accessories_banner.png" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" alt="Нова колекція">
            <div class="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent"></div>
            <div class="relative z-10 p-8 sm:p-12 flex flex-col justify-center h-full w-[85%] sm:w-2/3">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-4 uppercase tracking-widest w-fit">Тільки сьогодні</span>
              <h3 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">Знижка -20% на всі аксесуари</h3>
              <p class="text-sm text-slate-300 mb-8 font-medium">Оновіть свій стиль за найкращими цінами.</p>
              <a href="/deals" class="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg w-fit group-hover:scale-105 duration-300">
                Обрати зараз
              </a>
            </div>
          </div>

          <!-- Картка 2 -->
          <div class="relative rounded-3xl overflow-hidden shadow-xl group h-72 sm:h-80 md:h-[350px]">
            <img src="/electronics_banner.png" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" alt="Топ продажу">
            <div class="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent"></div>
            <div class="relative z-10 p-8 sm:p-12 flex flex-col justify-center h-full w-[85%] sm:w-2/3">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 mb-4 uppercase tracking-widest w-fit">🔥 Топ продажу</span>
              <h3 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">Нові моделі смарт-техніки</h3>
              <p class="text-sm text-slate-300 mb-8 font-medium">Найкращі гаджети для вашого комфорту.</p>
              <a href="/categories" class="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 w-fit group-hover:scale-105 duration-300">
                Переглянути
              </a>
            </div>
          </div>

        </div>
      </div>
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
          <a href="/deals" class="inline-flex items-center px-6 py-3.5 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 hover:scale-105 transition-all duration-300 shadow-xl shadow-black/20">
            Переглянути акції
            <svg class="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      </div>
    </section>

    <!-- Переваги магазину (Redesigned) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-100">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span class="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-600 mb-4 uppercase tracking-widest border border-indigo-100/80">Переваги магазину</span>
        <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">Наш сервіс — ваша впевненість</h2>
        <p class="text-base sm:text-lg text-slate-500 font-medium">Ми дбаємо про якість кожного замовлення та комфорт кожного клієнта</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <!-- Картка 1: Доставка -->
        <div class="relative overflow-hidden bg-gradient-to-b from-white to-slate-50/50 rounded-[2.5rem] border border-slate-200/50 p-8 sm:p-10 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
          <!-- Background glow effect -->
          <div class="absolute -right-16 -bottom-16 w-36 h-36 bg-blue-100/40 rounded-full filter blur-2xl group-hover:bg-blue-100/60 transition-colors duration-300"></div>
          
          <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 mb-8 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <!-- Modern SVG Box Icon -->
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 class="font-bold text-slate-900 text-xl tracking-tight mb-3">Швидка доставка</h3>
          <p class="text-sm sm:text-base text-slate-500 leading-relaxed font-normal">Відправляємо замовлення протягом 1–3 робочих днів по всій території України зручним для вас способом.</p>
        </div>

        <!-- Картка 2: Гарантія -->
        <div class="relative overflow-hidden bg-gradient-to-b from-white to-slate-50/50 rounded-[2.5rem] border border-slate-200/50 p-8 sm:p-10 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
          <!-- Background glow effect -->
          <div class="absolute -right-16 -bottom-16 w-36 h-36 bg-emerald-100/40 rounded-full filter blur-2xl group-hover:bg-emerald-100/60 transition-colors duration-300"></div>

          <div class="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-8 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <!-- Modern SVG Shield/Check Icon -->
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="font-bold text-slate-900 text-xl tracking-tight mb-3">Гарантія якості</h3>
          <p class="text-sm sm:text-base text-slate-500 leading-relaxed font-normal">Ми працюємо виключно з оригінальними та ретельно перевіреними товарами від надійних виробників.</p>
        </div>

        <!-- Картка 3: Підтримка -->
        <div class="relative overflow-hidden bg-gradient-to-b from-white to-slate-50/50 rounded-[2.5rem] border border-slate-200/50 p-8 sm:p-10 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
          <!-- Background glow effect -->
          <div class="absolute -right-16 -bottom-16 w-36 h-36 bg-indigo-100/40 rounded-full filter blur-2xl group-hover:bg-indigo-100/60 transition-colors duration-300"></div>

          <div class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 mb-8 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <!-- Modern SVG Message Chat Icon -->
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 class="font-bold text-slate-900 text-xl tracking-tight mb-3">Підтримка 24/7</h3>
          <p class="text-sm sm:text-base text-slate-500 leading-relaxed font-normal">Наші професійні менеджери завжди готові оперативно допомогти вам з вибором та будь-якими питаннями.</p>
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
        dot.classList.remove('bg-slate-300', 'w-2.5')
        dot.classList.add('bg-indigo-600', 'w-8')
      } else {
        dot.classList.remove('bg-indigo-600', 'w-8')
        dot.classList.add('bg-slate-300', 'w-2.5')
      }
    })

    contents.forEach((content, idx) => {
      if (idx === currentSlide) {
        content.classList.remove('translate-y-8', 'opacity-0')
        content.classList.add('translate-y-0', 'opacity-100')
      } else {
        content.classList.remove('translate-y-0', 'opacity-100')
        content.classList.add('translate-y-8', 'opacity-0')
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
