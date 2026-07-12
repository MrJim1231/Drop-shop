<?php
/**
 * deals.php — Deals / Discounted Products Page (SEO-optimized, server-rendered)
 * Replaces the SPA /deals route.
 */

require_once __DIR__ . '/backend/includes/db.php';

function slugify_php($str) {
    $str = mb_strtolower(trim($str));
    $str = preg_replace('/\s+/', '-', $str);
    $str = preg_replace('/[^a-z0-9\-\p{L}]/u', '', $str);
    return $str;
}

function format_price($price) {
    return number_format((float)$price, 2, '.', ' ') . ' ₴';
}

// ─── Fetch discounted products ───────────────────────────────────────────────
$products = [];
$result = $conn->query("
    SELECT p.id, p.name, p.price, p.discount, p.availability,
           (SELECT image FROM product_images WHERE product_id = p.id LIMIT 1) AS image
    FROM products p
    WHERE p.discount > 0 AND p.availability = 1
    ORDER BY p.discount DESC
    LIMIT 100
");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $row['discounted_price'] = round((float)$row['price'] * (1 - (int)$row['discount'] / 100), 2);
        $products[] = $row;
    }
}
$conn->close();

// ─── Pagination ──────────────────────────────────────────────────────────────
$page_size    = 24;
$total        = count($products);
$current_page = max(1, (int)($_GET['page'] ?? 1));
$total_pages  = $total > 0 ? (int)ceil($total / $page_size) : 1;
$slice        = array_slice($products, ($current_page - 1) * $page_size, $page_size);

// ─── SEO Meta ────────────────────────────────────────────────────────────────
$meta = [
    'title'          => 'Акції та знижки — DropShop | Гарячі пропозиції',
    'description'    => "Купуйте товари зі знижками до -50% в інтернет-магазині DropShop. {$total} акційних товарів у наявності. Швидка доставка по Україні.",
    'og_title'       => '🔥 Акційні товари — DropShop',
    'og_description' => "Гарячі знижки до -50%! {$total} товарів за суперцінами. Не пропустіть!",
];

include __DIR__ . '/header.php';
?>

<main id="ssr-main" class="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

  <!-- Hero Header -->
  <div class="mb-10 text-center md:text-left">
    <span class="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-rose-50 text-rose-600 mb-4 uppercase tracking-widest border border-rose-100/60">
      🔥 Гарячі пропозиції
    </span>
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
      Акційні товари
    </h1>
    <p class="text-base sm:text-lg text-slate-500 font-medium">
      Купуйте найкращі товари за суперцінами зі знижкою до
      <?= !empty($products) ? '-' . max(array_column($products, 'discount')) . '%' : '-50%' ?>
    </p>
  </div>

  <?php if (empty($products)): ?>
  <!-- Empty state -->
  <div class="text-center py-20 bg-slate-50 border border-slate-200/60 rounded-[2.5rem] p-8 max-w-2xl mx-auto">
    <div class="text-6xl mb-6">🏷️</div>
    <h2 class="text-2xl font-bold text-slate-800 mb-2">Наразі немає активних акцій</h2>
    <p class="text-slate-500 font-normal mb-8">Завітайте пізніше або перегляньте наш каталог товарів.</p>
    <a href="/course__udemy/categories"
       class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">
      Перейти до каталогу
    </a>
  </div>

  <?php else: ?>
  <!-- Products grid -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    <?php foreach ($slice as $p):
      $discount    = (int)$p['discount'];
      $price       = (float)$p['price'];
      $final_price = (float)$p['discounted_price'];
      $image       = $p['image'] ?: 'https://placehold.co/400x400/f1f5f9/94a3b8?text=' . rawurlencode($p['name']);
    ?>
    <article>
      <a href="/course__udemy/product/<?= htmlspecialchars($p['id']) ?>-<?= htmlspecialchars(slugify_php($p['name'])) ?>"
         class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-rose-200 transition-all flex flex-col h-full block">
        <div class="relative overflow-hidden bg-slate-50 aspect-square">
          <!-- Discount badge -->
          <span class="absolute top-2 left-2 z-10 bg-rose-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow">
            -<?= $discount ?>%
          </span>
          <img src="<?= htmlspecialchars($image) ?>"
               alt="<?= htmlspecialchars($p['name']) ?>"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               loading="lazy" />
        </div>
        <div class="p-4 flex flex-col flex-1">
          <h2 class="font-semibold text-slate-800 text-sm leading-tight mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            <?= htmlspecialchars($p['name']) ?>
          </h2>
          <div class="mt-auto">
            <div class="flex items-baseline gap-2 mb-3">
              <span class="text-lg font-black text-rose-600"><?= format_price($final_price) ?></span>
              <span class="text-sm text-slate-400 line-through font-medium"><?= format_price($price) ?></span>
            </div>
            <button type="button"
                    data-ssr-add-cart="<?= htmlspecialchars($p['id']) ?>"
                    data-product-name="<?= htmlspecialchars($p['name']) ?>"
                    data-product-price="<?= $final_price ?>"
                    data-product-image="<?= htmlspecialchars($image) ?>"
                    class="w-full px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">
              До кошика
            </button>
          </div>
        </div>
      </a>
    </article>
    <?php endforeach; ?>
  </div>

  <!-- Pagination -->
  <?php if ($total_pages > 1): ?>
  <div class="flex items-center justify-center gap-2 mt-12">
    <?php if ($current_page > 1): ?>
    <a href="?page=<?= $current_page - 1 ?>"
       class="inline-flex items-center px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors">
      ← Назад
    </a>
    <?php endif; ?>
    <?php for ($i = max(1, $current_page - 2); $i <= min($total_pages, $current_page + 2); $i++): ?>
    <a href="?page=<?= $i ?>"
       class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all <?= $i === $current_page ? 'bg-rose-600 text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600' ?>">
      <?= $i ?>
    </a>
    <?php endfor; ?>
    <?php if ($current_page < $total_pages): ?>
    <a href="?page=<?= $current_page + 1 ?>"
       class="inline-flex items-center px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors">
      Вперед →
    </a>
    <?php endif; ?>
  </div>
  <?php endif; ?>

  <!-- Structured Data JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Акційні товари — DropShop",
    "description": "Купуйте товари зі знижками до -<?= !empty($products) ? max(array_column($products, 'discount')) : 50 ?>% в інтернет-магазині DropShop.",
    "url": "<?= 'http'.(isset($_SERVER['HTTPS'])&&$_SERVER['HTTPS']==='on'?'s':'').'://'.$_SERVER['HTTP_HOST'].'/course__udemy/deals' ?>"
  }
  </script>

  <?php endif; ?>

</main>

<script>
  window.__SSR_PAGE__ = 'deals';
</script>

<?php include __DIR__ . '/footer.php'; ?>
