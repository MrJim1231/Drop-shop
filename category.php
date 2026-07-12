<?php
/**
 * category.php — Category Products Page (SEO-optimized, server-rendered by PHP)
 * Handles both:
 *   - Parent categories  → shows subcategories grid
 *   - Leaf categories    → shows products grid with filters sidebar + pagination
 *
 * URL format (from .htaccess): /category/{id}-{slug}
 */

require_once __DIR__ . '/backend/includes/db.php';
require_once __DIR__ . '/backend/includes/category_helpers.php';

// ─── Helper functions ───────────────────────────────────────────────────────
function slugify_php($str) {
    $str = mb_strtolower(trim($str));
    $str = preg_replace('/\s+/', '-', $str);
    $str = preg_replace('/[^a-z0-9\-\p{L}]/u', '', $str);
    return $str;
}

function format_price($price) {
    return number_format((float)$price, 2, '.', ' ') . ' ₴';
}

// ─── Get category ID from URL ────────────────────────────────────────────────
$raw_id     = $_GET['id'] ?? '';
$category_id = (int)preg_replace('/[^0-9]/', '', $raw_id);

if (!$category_id) {
    http_response_code(404);
    $meta = ['title' => 'Категорію не знайдено — DropShop'];
    include __DIR__ . '/header.php';
    echo '<main class="max-w-4xl mx-auto px-4 py-24 text-center"><h1 class="text-3xl font-bold text-slate-700">Категорію не знайдено</h1><a href="/course__udemy/categories" class="mt-4 inline-block text-indigo-600">← До каталогу</a></main>';
    include __DIR__ . '/footer.php';
    exit;
}

// ─── Fetch category ──────────────────────────────────────────────────────────
$stmt = $conn->prepare('SELECT id, name, parent_id, image FROM categories WHERE id = ?');
$stmt->bind_param('i', $category_id);
$stmt->execute();
$category = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$category) {
    http_response_code(404);
    $meta = ['title' => 'Категорію не знайдено — DropShop'];
    include __DIR__ . '/header.php';
    echo '<main class="max-w-4xl mx-auto px-4 py-24 text-center"><h1 class="text-3xl font-bold text-slate-700">Категорію не знайдено</h1><a href="/course__udemy/categories" class="mt-4 inline-block text-indigo-600">← До каталогу</a></main>';
    include __DIR__ . '/footer.php';
    exit;
}

// ─── Fetch parent category ───────────────────────────────────────────────────
$parent_category = null;
if ($category['parent_id']) {
    $p_stmt = $conn->prepare('SELECT id, name FROM categories WHERE id = ?');
    $parent_id_val = (int)$category['parent_id'];
    $p_stmt->bind_param('i', $parent_id_val);
    $p_stmt->execute();
    $parent_category = $p_stmt->get_result()->fetch_assoc();
    $p_stmt->close();
}

// ─── Fetch subcategories ─────────────────────────────────────────────────────
$subcategories = [];
$sub_stmt = $conn->prepare('SELECT id, name, image FROM categories WHERE parent_id = ? ORDER BY name');
$sub_stmt->bind_param('i', $category_id);
$sub_stmt->execute();
$sub_result = $sub_stmt->get_result();
while ($row = $sub_result->fetch_assoc()) {
    if (empty($row['image'])) {
        $child_id = (int)$row['id'];
        $desc_ids = getDescendantCategoryIds($conn, $child_id);
        $ids_list = implode(',', array_map('intval', $desc_ids));
        $img_res  = $conn->query("SELECT pi.image FROM product_images pi JOIN products p ON pi.product_id = p.id WHERE p.category_id IN ($ids_list) LIMIT 1");
        $img_row  = $img_res ? $img_res->fetch_assoc() : null;
        $row['image'] = $img_row['image'] ?? 'https://placehold.co/400x300/f1f5f9/94a3b8?text=' . rawurlencode($row['name']);
    }
    $subcategories[] = $row;
}
$sub_stmt->close();

// ─── Decide: parent or leaf category ────────────────────────────────────────
$is_parent = count($subcategories) > 0;

// ─── If leaf: fetch products ─────────────────────────────────────────────────
$products = [];
if (!$is_parent) {
    $all_cat_ids = getDescendantCategoryIds($conn, $category_id);
    $ids_list    = implode(',', array_map('intval', $all_cat_ids));

    $prod_result = $conn->query("
        SELECT p.id, p.name, p.price, p.discount, p.availability, p.supplier,
               (SELECT image FROM product_images WHERE product_id = p.id LIMIT 1) AS image
        FROM products p
        WHERE p.category_id IN ($ids_list) AND p.availability = 1
        ORDER BY p.name
    ");
    if ($prod_result) {
        while ($row = $prod_result->fetch_assoc()) {
            $products[] = $row;
        }
    }
}

$conn->close();

// ─── Pagination ──────────────────────────────────────────────────────────────
$page_size    = 20;
$total        = count($products);
$current_page = max(1, (int)($_GET['page'] ?? 1));
$total_pages  = $total > 0 ? (int)ceil($total / $page_size) : 1;
$slice        = array_slice($products, ($current_page - 1) * $page_size, $page_size);

// ─── SEO Meta ────────────────────────────────────────────────────────────────
$cat_name = $category['name'];
$meta_desc = $is_parent
    ? "Категорія «{$cat_name}» — оберіть підкатегорію та знайдіть потрібний товар у нашому магазині."
    : "Купити «{$cat_name}» в інтернет-магазині DropShop. {$total} товарів у наявності. Швидка доставка по Україні.";

$meta = [
    'title'          => "{$cat_name} — купити в DropShop",
    'description'    => $meta_desc,
    'og_title'       => "{$cat_name} — DropShop",
    'og_description' => $meta_desc,
    'og_image'       => $category['image'] ?? '',
];

include __DIR__ . '/header.php';
?>

<main id="ssr-main" class="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

  <!-- Breadcrumb -->
  <nav class="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium flex-wrap">
    <a href="/course__udemy/" class="hover:text-indigo-600 transition-colors">Головна</a>
    <span>›</span>
    <a href="/course__udemy/categories" class="hover:text-indigo-600 transition-colors">Каталог</a>
    <?php if ($parent_category): ?>
    <span>›</span>
    <a href="/course__udemy/category/<?= htmlspecialchars($parent_category['id']) ?>-<?= htmlspecialchars(slugify_php($parent_category['name'])) ?>"
       class="hover:text-indigo-600 transition-colors">
      <?= htmlspecialchars($parent_category['name']) ?>
    </a>
    <?php endif; ?>
    <span>›</span>
    <span class="text-slate-800 font-semibold"><?= htmlspecialchars($cat_name) ?></span>
  </nav>

  <!-- Category Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-800"><?= htmlspecialchars($cat_name) ?></h1>
    <p class="text-slate-500 mt-2">
      <?php if ($is_parent): ?>
        <?= count($subcategories) ?> підкатегорій
      <?php else: ?>
        <?= $total ?> товарів
      <?php endif; ?>
    </p>
  </div>

  <?php if ($is_parent): ?>
  <!-- ═══ PARENT CATEGORY → Show subcategories grid ═══ -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    <?php foreach ($subcategories as $sub): ?>
    <a href="/course__udemy/category/<?= htmlspecialchars($sub['id']) ?>-<?= htmlspecialchars(slugify_php($sub['name'])) ?>"
       class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all">
      <div class="aspect-[4/3] bg-slate-100 overflow-hidden">
        <img src="<?= htmlspecialchars($sub['image']) ?>"
             alt="<?= htmlspecialchars($sub['name']) ?>"
             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
             loading="lazy" />
      </div>
      <div class="p-4">
        <h2 class="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
          <?= htmlspecialchars($sub['name']) ?>
        </h2>
      </div>
    </a>
    <?php endforeach; ?>
  </div>

  <?php else: ?>
  <!-- ═══ LEAF CATEGORY → Show products with sidebar ═══ -->

  <?php if (empty($products)): ?>
    <p class="text-center text-slate-500 py-16 text-lg">У цій категорії поки немає товарів</p>
  <?php else: ?>

  <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">

    <!-- ─── Left sidebar ─── -->
    <aside class="lg:col-span-1 hidden lg:block">
      <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-20">
        <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Категорії</h3>
        <?php if ($parent_category): ?>
        <a href="/course__udemy/category/<?= htmlspecialchars($parent_category['id']) ?>-<?= htmlspecialchars(slugify_php($parent_category['name'])) ?>"
           class="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-600 font-semibold mb-3 transition-colors">
          ← <?= htmlspecialchars($parent_category['name']) ?>
        </a>
        <?php endif; ?>
        <p class="text-xs font-bold text-indigo-600 px-2 py-1 bg-indigo-50 rounded-lg mb-2">
          <?= htmlspecialchars($cat_name) ?>
        </p>

        <?php
        // Unique suppliers for filtering
        $suppliers = array_unique(array_filter(array_column($products, 'supplier')));
        sort($suppliers);
        if (!empty($suppliers)):
        ?>
        <div class="mt-4 border-t border-slate-100 pt-4">
          <h4 class="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3">Постачальник</h4>
          <div class="space-y-1.5" id="supplier-filters">
            <?php foreach ($suppliers as $sup): ?>
            <label class="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800 cursor-pointer group">
              <input type="checkbox" class="supplier-filter-cb w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer"
                     value="<?= htmlspecialchars($sup) ?>" />
              <span class="truncate group-hover:text-indigo-600 transition-colors"><?= htmlspecialchars($sup) ?></span>
            </label>
            <?php endforeach; ?>
          </div>
        </div>
        <?php endif; ?>

        <div class="mt-4 border-t border-slate-100 pt-4">
          <h4 class="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3">Ціна</h4>
          <div class="flex gap-2 items-center">
            <input type="number" id="price-min" placeholder="від" min="0"
                   class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-400" />
            <span class="text-slate-400 text-xs">—</span>
            <input type="number" id="price-max" placeholder="до" min="0"
                   class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-400" />
          </div>
          <button type="button" id="apply-filters"
                  class="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
            Застосувати
          </button>
          <button type="button" id="reset-filters"
                  class="mt-1.5 w-full py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Скинути
          </button>
        </div>
      </div>
    </aside>

    <!-- ─── Products grid ─── -->
    <div class="lg:col-span-3">
      <div id="products-grid" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <?php foreach ($slice as $p):
          $discount    = (int)($p['discount'] ?? 0);
          $price       = (float)$p['price'];
          $final_price = $discount > 0 ? round($price * (1 - $discount / 100), 2) : $price;
          $image       = $p['image'] ?: 'https://placehold.co/400x400/f1f5f9/94a3b8?text=' . rawurlencode($p['name']);
        ?>
        <article>
          <a href="/course__udemy/product/<?= htmlspecialchars($p['id']) ?>-<?= htmlspecialchars(slugify_php($p['name'])) ?>"
             class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col h-full block"
             data-product-id="<?= htmlspecialchars($p['id']) ?>">
            <div class="relative overflow-hidden bg-slate-50 aspect-square">
              <?php if ($discount > 0): ?>
              <span class="absolute top-2 left-2 z-10 bg-rose-500 text-white text-xs font-black px-2 py-0.5 rounded-lg">
                -<?= $discount ?>%
              </span>
              <?php endif; ?>
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

      <!-- Pagination -->
      <?php if ($total_pages > 1): ?>
      <div class="flex items-center justify-center gap-2 mt-10">
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
    </div>
  </div>

  <!-- Client-side filter logic (runs inline, no extra JS bundle needed) -->
  <script>
  (function() {
    // Collect all product data for client-side filtering
    const allProducts = <?= json_encode(array_map(function($p) {
      $d = (int)($p['discount'] ?? 0);
      $pr = (float)$p['price'];
      return [
        'id'       => $p['id'],
        'name'     => $p['name'],
        'price'    => $d > 0 ? round($pr * (1 - $d / 100), 2) : $pr,
        'orig_price'=> $pr,
        'discount' => $d,
        'supplier' => $p['supplier'] ?? '',
        'image'    => $p['image'] ?? '',
      ];
    }, $products), JSON_UNESCAPED_UNICODE) ?>;

    const grid    = document.getElementById('products-grid');
    const PAGE_SZ = 20;

    function slugify(str) {
      return (str || '').toLowerCase().replace(/\s+/g,'-').replace(/[^\w\u0400-\u04ff\-]/g,'');
    }

    function priceCard(p) {
      const final = p.price;
      const orig  = p.orig_price;
      const disc  = p.discount;
      const img   = p.image || 'https://placehold.co/400x400/f1f5f9/94a3b8?text=' + encodeURIComponent(p.name);
      return `<article>
        <a href="/course__udemy/product/${p.id}-${slugify(p.name)}"
           class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col h-full block">
          <div class="relative overflow-hidden bg-slate-50 aspect-square">
            ${disc > 0 ? `<span class="absolute top-2 left-2 z-10 bg-rose-500 text-white text-xs font-black px-2 py-0.5 rounded-lg">-${disc}%</span>` : ''}
            <img src="${img}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          </div>
          <div class="p-4 flex flex-col flex-1">
            <h2 class="font-semibold text-slate-800 text-sm leading-tight mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">${p.name}</h2>
            <div class="mt-auto">
              <div class="flex items-baseline gap-2 mb-3">
                <span class="text-lg font-black text-slate-900">${final.toFixed(2)} ₴</span>
                ${disc > 0 ? `<span class="text-sm text-slate-400 line-through font-medium">${orig.toFixed(2)} ₴</span>` : ''}
              </div>
              <button type="button"
                      data-ssr-add-cart="${p.id}"
                      data-product-name="${p.name}"
                      data-product-price="${final}"
                      data-product-image="${img}"
                      class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">
                До кошика
              </button>
            </div>
          </div>
        </a>
      </article>`;
    }

    function renderFiltered() {
      const minPrice   = parseFloat(document.getElementById('price-min')?.value) || 0;
      const maxPrice   = parseFloat(document.getElementById('price-max')?.value) || Infinity;
      const activeSups = [...document.querySelectorAll('.supplier-filter-cb:checked')].map(cb => cb.value);

      let filtered = allProducts.filter(p => {
        const priceOk = p.price >= minPrice && p.price <= maxPrice;
        const supOk   = activeSups.length === 0 || activeSups.includes(p.supplier);
        return priceOk && supOk;
      });

      grid.innerHTML = filtered.length
        ? filtered.slice(0, PAGE_SZ).map(priceCard).join('')
        : '<div class="col-span-3 text-center text-slate-500 py-16">Немає товарів за обраними фільтрами</div>';

      // Re-bind cart buttons after re-render
      if (window.__SSR_CART_BIND) window.__SSR_CART_BIND();
    }

    document.getElementById('apply-filters')?.addEventListener('click', renderFiltered);
    document.getElementById('reset-filters')?.addEventListener('click', () => {
      document.getElementById('price-min').value = '';
      document.getElementById('price-max').value = '';
      document.querySelectorAll('.supplier-filter-cb').forEach(cb => cb.checked = false);
      renderFiltered();
    });
  })();
  </script>

  <?php endif; // end products ?>
  <?php endif; // end leaf category ?>

  <!-- Structured Data JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "<?= addslashes($cat_name) ?>",
    "description": "<?= addslashes($meta_desc) ?>",
    "url": "<?= addslashes('http' . (isset($_SERVER['HTTPS'])&&$_SERVER['HTTPS']==='on'?'s':'') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']) ?>"
  }
  </script>

</main>

<script>
  window.__SSR_PAGE__ = 'category';
  // Expose cart-bind hook for re-rendered cards
  window.__SSR_CART_BIND = function() {
    if (window.__SSR_BIND_DONE) return;
    // The main router.js bindSSRCartButtons() will handle initial bind.
    // This hook handles re-renders after client-side filtering.
    document.querySelectorAll('[data-ssr-add-cart]:not([data-ssr-bound])').forEach(btn => {
      btn.dataset.ssrBound = '1';
      btn.addEventListener('click', () => {
        const event = new CustomEvent('ssr-add-to-cart', {
          detail: {
            id:    btn.getAttribute('data-ssr-add-cart'),
            name:  btn.getAttribute('data-product-name'),
            price: parseFloat(btn.getAttribute('data-product-price')) || 0,
            image: btn.getAttribute('data-product-image') || ''
          }
        });
        document.dispatchEvent(event);
      });
    });
  };
</script>

<?php include __DIR__ . '/footer.php'; ?>
