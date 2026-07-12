<?php
/**
 * index.php — Home Page (SEO-optimized, server-rendered by PHP)
 * Replaces the SPA /  route for search engines and link previews.
 */

require_once __DIR__ . '/backend/includes/db.php';
require_once __DIR__ . '/backend/includes/category_helpers.php';

// ───── Fetch latest 8 products ─────
$products = [];
$res = $conn->query("
  SELECT p.id, p.name, p.price, p.discount, p.description, p.category_id,
         (SELECT image FROM product_images WHERE product_id = p.id LIMIT 1) AS image
  FROM products p
  ORDER BY p.id DESC
  LIMIT 8
");
if ($res) {
  while ($row = $res->fetch_assoc()) {
    $products[] = $row;
  }
}

// ───── Fetch root categories ─────
$categories = [];
$cat_res = $conn->query("SELECT id, name, image FROM categories WHERE parent_id IS NULL ORDER BY name LIMIT 6");
if ($cat_res) {
  while ($row = $cat_res->fetch_assoc()) {
    if (empty($row['image'])) {
      $desc_ids = getDescendantCategoryIds($conn, (int)$row['id']);
      $ids_list = implode(',', array_map('intval', $desc_ids));
      $img_res = $conn->query("SELECT pi.image FROM product_images pi JOIN products p ON pi.product_id = p.id WHERE p.category_id IN ($ids_list) LIMIT 1");
      $img_row = $img_res ? $img_res->fetch_assoc() : null;
      $row['image'] = ($img_row && !empty($img_row['image']))
        ? $img_row['image']
        : 'https://placehold.co/400x300/f1f5f9/94a3b8?text=' . rawurlencode($row['name']);
    }
    $categories[] = $row;
  }
}

$conn->close();

// ───── SEO Meta ─────
$meta = [
  'title'          => 'DropShop — Інтернет-магазин | Кращі ціни в Україні',
  'description'    => 'Купуйте товари онлайн за найкращими цінами. Швидка доставка по Україні. Електроніка, аксесуари, товари для дому та спорту.',
  'og_title'       => 'DropShop — Широкий вибір товарів з доставкою по Україні',
  'og_description' => 'Тисячі товарів у наявності. Зручна оплата. Надійна доставка.',
];

include __DIR__ . '/header.php';

// ───── Helper functions ─────
function slugify_php($str) {
  $str = mb_strtolower(trim($str));
  $str = preg_replace('/\s+/', '-', $str);
  $str = preg_replace('/[^a-z0-9\-\p{L}]/u', '', $str);
  return $str;
}

function format_price($price) {
  return number_format((float)$price, 2, '.', ' ') . ' ₴';
}
?>

<!-- SPA shell: header, cart, auth, dark-mode toggle all rendered by JS -->
<div id="app-header">
  <div id="spa-header-placeholder"></div>
</div>

<main id="ssr-main" class="page-enter">

  <!-- ═══ HERO SLIDER ═══ -->
  <section class="relative overflow-hidden bg-slate-50 group border-b border-slate-200/60">
    <div id="home-slider-container" class="relative h-[500px] sm:h-[550px] md:h-[650px] w-full flex transition-transform duration-700 ease-in-out" style="width:300%;transform:translateX(0%)">

      <!-- Slide 1 -->
      <div class="w-1/3 h-full relative flex-shrink-0 flex items-center overflow-hidden bg-slate-50">
        <div class="absolute top-0 right-0 w-[85%] md:w-[65%] h-full z-0" style="clip-path:polygon(15% 0,100% 0,100% 100%,0% 100%)">
          <img src="/course__udemy/frontend/dist/electronics_banner.webp" class="w-full h-full object-cover" alt="Електроніка" loading="eager" />
        </div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20 flex">
          <div class="w-full md:w-[55%] lg:w-[45%]">
            <div class="bg-white/80 backdrop-blur-2xl p-8 sm:p-12 rounded-[2rem] shadow-2xl border border-white/80">
              <span class="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 mb-6 uppercase tracking-widest">✨ Нова колекція</span>
              <h1 class="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-5">Світ передової електроніки</h1>
              <p class="text-base sm:text-lg text-slate-600 font-medium mb-8">Відкрийте для себе найсучасніші смартфони, навушники та смарт-гаджети.</p>
              <div class="flex flex-wrap gap-4">
                <a href="/course__udemy/categories" class="inline-flex items-center px-7 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all">Перейти до каталогу</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Slide 2 -->
      <div class="w-1/3 h-full relative flex-shrink-0 flex items-center overflow-hidden bg-slate-50">
        <div class="absolute top-0 right-0 w-[85%] md:w-[65%] h-full z-0" style="clip-path:polygon(15% 0,100% 0,100% 100%,0% 100%)">
          <img src="/course__udemy/frontend/dist/accessories_banner.webp" class="w-full h-full object-cover" alt="Аксесуари" loading="lazy" />
        </div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20 flex">
          <div class="w-full md:w-[55%] lg:w-[45%]">
            <div class="bg-white/80 backdrop-blur-2xl p-8 sm:p-12 rounded-[2rem] shadow-2xl border border-white/80">
              <span class="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 mb-6 uppercase tracking-widest">✨ Нова колекція</span>
              <h2 class="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-5">Преміальні аксесуари</h2>
              <p class="text-base sm:text-lg text-slate-600 font-medium mb-8">Создайте свій неповторний образ із нашою колекцією годинників та окулярів.</p>
              <div class="flex flex-wrap gap-4">
                <a href="/course__udemy/categories" class="inline-flex items-center px-7 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all">Обрати стиль</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Slide 3 -->
      <div class="w-1/3 h-full relative flex-shrink-0 flex items-center overflow-hidden bg-slate-50">
        <div class="absolute top-0 right-0 w-[85%] md:w-[65%] h-full z-0" style="clip-path:polygon(15% 0,100% 0,100% 100%,0% 100%)">
          <img src="/course__udemy/frontend/dist/home_banner.webp" class="w-full h-full object-cover" alt="Розумний дім" loading="lazy" />
        </div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20 flex">
          <div class="w-full md:w-[55%] lg:w-[45%]">
            <div class="bg-white/80 backdrop-blur-2xl p-8 sm:p-12 rounded-[2rem] shadow-2xl border border-white/80">
              <span class="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 mb-6 uppercase tracking-widest">✨ Нова колекція</span>
              <h2 class="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-5">Розумний та затишний дім</h2>
              <p class="text-base sm:text-lg text-slate-600 font-medium mb-8">Інноваційні гаджети та побутова техніка для комфортного повсякденного життя.</p>
              <div class="flex flex-wrap gap-4">
                <a href="/course__udemy/categories" class="inline-flex items-center px-7 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all">Дивитись товари</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Slider controls -->
    <button id="slider-prev" aria-label="Попередній слайд" class="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md text-slate-800 flex items-center justify-center border border-slate-200 shadow-lg z-30 cursor-pointer">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
    </button>
    <button id="slider-next" aria-label="Наступний слайд" class="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md text-slate-800 flex items-center justify-center border border-slate-200 shadow-lg z-30 cursor-pointer">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
    </button>
  </section>

  <!-- ═══ CATEGORIES SECTION ═══ -->
  <?php if (!empty($categories)): ?>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-2xl font-black text-slate-900">Популярні категорії</h2>
        <p class="text-slate-500 font-medium mt-1">Оберіть потрібний розділ</p>
      </div>
      <a href="/course__udemy/categories" class="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1">
        Усі категорії →
      </a>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <?php foreach ($categories as $cat): ?>
      <a href="/course__udemy/category/<?= htmlspecialchars($cat['id']) ?>-<?= htmlspecialchars(slugify_php($cat['name'])) ?>"
         class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all text-center">
        <div class="aspect-square bg-slate-50 overflow-hidden">
          <img src="<?= htmlspecialchars($cat['image']) ?>"
               alt="<?= htmlspecialchars($cat['name']) ?>"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
               loading="lazy" />
        </div>
        <div class="p-3">
          <h3 class="font-semibold text-slate-700 group-hover:text-indigo-600 text-sm transition-colors"><?= htmlspecialchars($cat['name']) ?></h3>
        </div>
      </a>
      <?php endforeach; ?>
    </div>
  </section>
  <?php endif; ?>

  <!-- ═══ LATEST PRODUCTS SECTION ═══ -->
  <?php if (!empty($products)): ?>
  <section class="bg-slate-50/60 border-t border-slate-200/60 py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-2xl font-black text-slate-900">Нові надходження</h2>
          <p class="text-slate-500 font-medium mt-1">Останні товари у нашому магазині</p>
        </div>
        <a href="/course__udemy/categories" class="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">Усі товари →</a>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        <?php foreach ($products as $p):
          $discount = (int)($p['discount'] ?? 0);
          $price = (float)$p['price'];
          $final_price = $discount > 0 ? round($price * (1 - $discount / 100), 2) : $price;
          $image = $p['image'] ?: 'https://placehold.co/400x400/f1f5f9/94a3b8?text=' . rawurlencode($p['name']);
        ?>
        <article>
          <a href="/course__udemy/product/<?= htmlspecialchars($p['id']) ?>-<?= htmlspecialchars(slugify_php($p['name'])) ?>"
             class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col h-full block">
            <div class="relative overflow-hidden bg-slate-50 aspect-square">
              <?php if ($discount > 0): ?>
              <span class="absolute top-2 left-2 z-10 bg-rose-500 text-white text-xs font-black px-2 py-0.5 rounded-lg">-<?= $discount ?>%</span>
              <?php endif; ?>
              <img src="<?= htmlspecialchars($image) ?>"
                   alt="<?= htmlspecialchars($p['name']) ?>"
                   class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                   loading="lazy" />
            </div>
            <div class="p-4 flex flex-col flex-1">
              <h3 class="font-semibold text-slate-800 text-sm leading-tight mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                <?= htmlspecialchars($p['name']) ?>
              </h3>
              <div class="mt-auto">
                <div class="flex items-baseline gap-2 mb-3">
                  <span class="text-lg font-black text-slate-900"><?= format_price($final_price) ?></span>
                  <?php if ($discount > 0): ?>
                  <span class="text-sm text-slate-400 line-through font-medium"><?= format_price($price) ?></span>
                  <?php endif; ?>
                </div>
                <button type="button"
                        data-ssr-add-cart="<?= htmlspecialchars($p['id']) ?>"
                        data-product-name="<?= htmlspecialchars($p['name']) ?>"
                        data-product-price="<?= $final_price ?>"
                        data-product-image="<?= htmlspecialchars($image) ?>"
                        class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">
                  До кошика
                </button>
              </div>
            </div>
          </a>
        </article>
        <?php endforeach; ?>
      </div>
    </div>
  </section>
  <?php endif; ?>

</main>

<script>
  // Simple slider logic (runs inline so no JS bundle needed)
  (function() {
    const slider = document.getElementById('home-slider-container');
    if (!slider) return;
    let current = 0;
    const total = 3;
    function goTo(n) {
      current = (n + total) % total;
      slider.style.transform = 'translateX(-' + (current * 100 / total) + '%)';
    }
    document.getElementById('slider-prev')?.addEventListener('click', () => goTo(current - 1));
    document.getElementById('slider-next')?.addEventListener('click', () => goTo(current + 1));
    setInterval(() => goTo(current + 1), 5000);
  })();

  // Tell the SPA JS it's running in SSR hydration mode (skip re-rendering main content)
  window.__SSR_PAGE__ = 'home';
</script>

<?php include __DIR__ . '/footer.php'; ?>
