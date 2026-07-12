<?php
/**
 * product.php — Product Detail Page (SEO-optimized, server-rendered)
 * Provides full OpenGraph metadata for social sharing previews.
 * The interactive Add-to-Cart button is handled by the SPA hydration JS.
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

// ───── Get product ID from URL ─────
$raw_id = $_GET['id'] ?? '';
$product_id = preg_replace('/[^a-zA-Z0-9_\-]/', '', $raw_id);

if (empty($product_id)) {
  http_response_code(404);
  $meta = ['title' => 'Товар не знайдено — DropShop'];
  include __DIR__ . '/header.php';
  echo '<main class="max-w-4xl mx-auto px-4 py-24 text-center"><h1 class="text-3xl font-bold text-slate-700">Товар не знайдено</h1><a href="/course__udemy/categories" class="mt-4 inline-block text-indigo-600 hover:underline">← До каталогу</a></main>';
  include __DIR__ . '/footer.php';
  exit;
}

// ───── Fetch product from DB ─────
$stmt = $conn->prepare("
  SELECT p.*, c.name AS category_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.id = ?
  LIMIT 1
");
$stmt->bind_param('s', $product_id);
$stmt->execute();
$result = $stmt->get_result();
$product = $result->fetch_assoc();
$stmt->close();

if (!$product) {
  http_response_code(404);
  $meta = ['title' => 'Товар не знайдено — DropShop'];
  include __DIR__ . '/header.php';
  echo '<main class="max-w-4xl mx-auto px-4 py-24 text-center"><h1 class="text-3xl font-bold text-slate-700">Товар не знайдено</h1><a href="/course__udemy/categories" class="mt-4 inline-block text-indigo-600 hover:underline">← До каталогу</a></main>';
  include __DIR__ . '/footer.php';
  exit;
}

// ───── Fetch product images ─────
$images = [];
$img_stmt = $conn->prepare("SELECT image FROM product_images WHERE product_id = ? ORDER BY id");
$img_stmt->bind_param('s', $product_id);
$img_stmt->execute();
$img_result = $img_stmt->get_result();
while ($img_row = $img_result->fetch_assoc()) {
  $images[] = $img_row['image'];
}
$img_stmt->close();
$conn->close();

$main_image    = $images[0] ?? 'https://placehold.co/600x600/f1f5f9/94a3b8?text=' . rawurlencode($product['name']);
$discount      = (int)($product['discount'] ?? 0);
$price         = (float)$product['price'];
$final_price   = $discount > 0 ? round($price * (1 - $discount / 100), 2) : $price;
$category_name = $product['category_name'] ?? '';
$cat_id        = $product['category_id'] ?? '';
$description   = $product['description'] ?? '';
$description_short = mb_substr(strip_tags($description), 0, 160);

// ───── SEO Meta ─────
$site_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
$meta = [
  'title'          => htmlspecialchars($product['name']) . ' — DropShop',
  'description'    => $description_short ?: ('Купити ' . $product['name'] . ' в інтернет-магазині DropShop. Швидка доставка по Україні.'),
  'og_title'       => $product['name'],
  'og_description' => $description_short ?: ('Купити ' . $product['name'] . ' за ціною ' . format_price($final_price)),
  'og_image'       => $main_image,
  'og_url'         => $site_url . '/course__udemy/product/' . $product_id . '-' . slugify_php($product['name']),
];

include __DIR__ . '/header.php';
?>

<main id="ssr-main" class="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

  <!-- Breadcrumb -->
  <nav class="flex items-center gap-2 text-sm text-slate-500 mb-8 font-medium flex-wrap">
    <a href="/course__udemy/" class="hover:text-indigo-600 transition-colors">Головна</a>
    <span>›</span>
    <a href="/course__udemy/categories" class="hover:text-indigo-600 transition-colors">Каталог</a>
    <?php if ($category_name): ?>
    <span>›</span>
    <a href="/course__udemy/category/<?= htmlspecialchars($cat_id) ?>-<?= htmlspecialchars(slugify_php($category_name)) ?>"
       class="hover:text-indigo-600 transition-colors">
      <?= htmlspecialchars($category_name) ?>
    </a>
    <?php endif; ?>
    <span>›</span>
    <span class="text-slate-800 font-semibold truncate max-w-xs"><?= htmlspecialchars($product['name']) ?></span>
  </nav>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

    <!-- ─── Images ─── -->
    <div>
      <div class="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 aspect-square mb-4">
        <img id="main-product-image"
             src="<?= htmlspecialchars($main_image) ?>"
             alt="<?= htmlspecialchars($product['name']) ?>"
             class="w-full h-full object-contain p-4"
             loading="eager" />
      </div>
      <?php if (count($images) > 1): ?>
      <div class="flex gap-3 overflow-x-auto pb-2">
        <?php foreach ($images as $i => $img): ?>
        <button type="button"
                onclick="document.getElementById('main-product-image').src='<?= htmlspecialchars($img) ?>'"
                class="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-slate-200 hover:border-indigo-400 overflow-hidden transition-all cursor-pointer bg-white">
          <img src="<?= htmlspecialchars($img) ?>"
               alt="<?= htmlspecialchars($product['name']) ?> — зображення <?= $i + 1 ?>"
               class="w-full h-full object-cover"
               loading="lazy" />
        </button>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>
    </div>

    <!-- ─── Product Info ─── -->
    <div class="flex flex-col">

      <?php if ($category_name): ?>
      <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2"><?= htmlspecialchars($category_name) ?></span>
      <?php endif; ?>

      <h1 class="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-4">
        <?= htmlspecialchars($product['name']) ?>
      </h1>

      <!-- Price -->
      <div class="flex items-baseline gap-3 mb-6">
        <span class="text-3xl font-black text-slate-900"><?= format_price($final_price) ?></span>
        <?php if ($discount > 0): ?>
        <span class="text-xl text-slate-400 line-through font-medium"><?= format_price($price) ?></span>
        <span class="bg-rose-100 text-rose-700 text-sm font-black px-3 py-1 rounded-full">-<?= $discount ?>%</span>
        <?php endif; ?>
      </div>

      <!-- Availability -->
      <?php
        $avail = (int)($product['availability'] ?? 1);
        $avail_text  = match($avail) { 1 => 'В наявності', 2 => 'Під замовлення', 3 => 'Немає в наявності', default => 'В наявності' };
        $avail_color = match($avail) { 3 => 'text-rose-600 bg-rose-50 border-rose-200', 2 => 'text-amber-600 bg-amber-50 border-amber-200', default => 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      ?>
      <div class="mb-6">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border <?= $avail_color ?>">
          <span class="w-2 h-2 rounded-full <?= $avail === 3 ? 'bg-rose-500' : ($avail === 2 ? 'bg-amber-500' : 'bg-emerald-500') ?>"></span>
          <?= htmlspecialchars($avail_text) ?>
        </span>
      </div>

      <!-- Add to cart (interactive — handled by SPA JS hydration) -->
      <button type="button"
              id="ssr-add-to-cart"
              data-ssr-add-cart="<?= htmlspecialchars($product['id']) ?>"
              data-product-name="<?= htmlspecialchars($product['name']) ?>"
              data-product-price="<?= $final_price ?>"
              data-product-image="<?= htmlspecialchars($main_image) ?>"
              class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-lg transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 cursor-pointer mb-4">
        🛒 Додати до кошика
      </button>

      <!-- Product specs -->
      <?php
        $specs = [];
        if (!empty($product['size']))              $specs['Розмір / Вага'] = $product['size'];
        if (!empty($product['weight']))            $specs['Вага'] = $product['weight'] . ' кг';
        if (!empty($product['quantity_in_stock'])) $specs['Залишок'] = $product['quantity_in_stock'] . ' шт';
        if (!empty($product['supplier']))          $specs['Постачальник'] = $product['supplier'];
      ?>
      <?php if (!empty($specs)): ?>
      <div class="border border-slate-200 rounded-2xl overflow-hidden mb-6">
        <table class="w-full text-sm">
          <?php foreach ($specs as $key => $val): ?>
          <tr class="border-b border-slate-100 last:border-0">
            <td class="px-4 py-3 text-slate-500 font-medium w-1/2"><?= htmlspecialchars($key) ?></td>
            <td class="px-4 py-3 text-slate-800 font-semibold"><?= htmlspecialchars($val) ?></td>
          </tr>
          <?php endforeach; ?>
        </table>
      </div>
      <?php endif; ?>

      <!-- Description -->
      <?php if (!empty($description)): ?>
      <div class="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed">
        <h2 class="text-base font-bold text-slate-800 mb-2">Опис товару</h2>
        <div><?= nl2br(htmlspecialchars($description)) ?></div>
      </div>
      <?php endif; ?>

    </div>
  </div>

  <!-- Structured Data JSON-LD (for Google rich results) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "<?= addslashes($product['name']) ?>",
    "image": "<?= addslashes($main_image) ?>",
    "description": "<?= addslashes($description_short) ?>",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "UAH",
      "price": "<?= $final_price ?>",
      "availability": "<?= $avail === 1 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' ?>"
    }
  }
  </script>

</main>

<script>
  window.__SSR_PAGE__ = 'product';
  window.__SSR_PRODUCT_ID__ = '<?= addslashes($product_id) ?>';
</script>

<?php include __DIR__ . '/footer.php'; ?>
