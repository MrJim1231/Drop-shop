<?php
/**
 * categories.php — Categories Catalog Page (SEO-optimized, server-rendered)
 * Replaces the SPA /categories route for search engines.
 */

require_once __DIR__ . '/backend/includes/db.php';
require_once __DIR__ . '/backend/includes/category_helpers.php';

function slugify_php($str) {
  $str = mb_strtolower(trim($str));
  $str = preg_replace('/\s+/', '-', $str);
  $str = preg_replace('/[^a-z0-9\-\p{L}]/u', '', $str);
  return $str;
}

// ───── Fetch all root categories ─────
$categories = [];
$res = $conn->query("SELECT id, name, image FROM categories WHERE parent_id IS NULL ORDER BY name");
if ($res) {
  while ($row = $res->fetch_assoc()) {
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

// ───── Pagination ─────
$page_size = 24;
$total = count($categories);
$current_page = max(1, (int)($_GET['page'] ?? 1));
$total_pages = (int)ceil($total / $page_size);
$slice = array_slice($categories, ($current_page - 1) * $page_size, $page_size);

// ───── SEO Meta ─────
$meta = [
  'title'          => 'Каталог категорій — DropShop | Широкий вибір товарів',
  'description'    => 'Переглядайте каталог категорій нашого магазину. Електроніка, аксесуари, спорт, товари для дому — все з доставкою по Україні.',
  'og_title'       => 'Каталог категорій — DropShop',
  'og_description' => 'Оберіть розділ та знайдіть потрібний товар серед тисяч позицій нашого магазину.',
];

include __DIR__ . '/header.php';
?>

<main id="ssr-main" class="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-800">Каталог категорій</h1>
    <p class="text-slate-500 mt-2">Оберіть розділ для перегляду товарів</p>
  </div>

  <!-- Categories Grid -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    <?php foreach ($slice as $cat): ?>
    <a href="/course__udemy/category/<?= htmlspecialchars($cat['id']) ?>-<?= htmlspecialchars(slugify_php($cat['name'])) ?>"
       class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all">
      <div class="aspect-[4/3] bg-slate-100 overflow-hidden">
        <img src="<?= htmlspecialchars($cat['image']) ?>"
             alt="<?= htmlspecialchars($cat['name']) ?>"
             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
             loading="lazy" />
      </div>
      <div class="p-4">
        <h2 class="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
          <?= htmlspecialchars($cat['name']) ?>
        </h2>
      </div>
    </a>
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
       class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all <?= $i === $current_page ? 'bg-indigo-600 text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600' ?>">
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

</main>

<script>
  window.__SSR_PAGE__ = 'categories';
</script>

<?php include __DIR__ . '/footer.php'; ?>
