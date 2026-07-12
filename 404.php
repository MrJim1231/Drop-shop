<?php
/**
 * 404.php — Custom Not Found Error Page
 * Shown by Apache when a page is not found (configured in .htaccess).
 */

http_response_code(404);

$meta = [
    'title'          => '404 — Сторінку не знайдено | DropShop',
    'description'    => 'На жаль, сторінку, яку ви шукаєте, не знайдено. Поверніться до каталогу або на головну сторінку.',
    'og_title'       => '404 — Сторінку не знайдено',
    'og_description' => 'Поверніться до каталогу DropShop.',
];

include __DIR__ . '/header.php';
?>

<main class="min-h-screen flex items-center justify-center px-4 py-20">
  <div class="text-center max-w-lg">

    <!-- Big 404 -->
    <div class="relative mb-8 inline-block">
      <div class="text-[10rem] font-black text-slate-100 select-none leading-none">404</div>
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="text-6xl">🔍</span>
      </div>
    </div>

    <h1 class="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
      Сторінку не знайдено
    </h1>
    <p class="text-slate-500 text-lg font-medium mb-10">
      Можливо, посилання застаріло, або сторінку було переміщено чи видалено.
    </p>

    <!-- Action buttons -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <a href="/course__udemy/"
         class="inline-flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5">
        🏠 На головну
      </a>
      <a href="/course__udemy/categories"
         class="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all hover:-translate-y-0.5">
        📦 До каталогу
      </a>
      <a href="/course__udemy/deals"
         class="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 font-bold rounded-xl transition-all hover:-translate-y-0.5">
        🔥 Акції
      </a>
    </div>

    <!-- Popular categories hint -->
    <div class="mt-14 border-t border-slate-100 pt-10">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Можливо, ви шукали</p>
      <div class="flex flex-wrap justify-center gap-2">
        <?php
        // Fetch a few popular categories
        require_once __DIR__ . '/backend/includes/db.php';
        $cats = $conn->query("SELECT id, name FROM categories WHERE parent_id IS NULL ORDER BY name LIMIT 8");
        if ($cats) {
          while ($c = $cats->fetch_assoc()) {
            $slug = mb_strtolower($c['name']);
            $slug = preg_replace('/\s+/', '-', $slug);
            echo '<a href="/course__udemy/category/' . htmlspecialchars($c['id']) . '-' . htmlspecialchars($slug) . '"
                    class="px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 text-xs font-semibold rounded-full transition-colors">'
                . htmlspecialchars($c['name']) . '</a>';
          }
        }
        $conn->close();
        ?>
      </div>
    </div>

  </div>
</main>

<script>
  window.__SSR_PAGE__ = '404';
</script>

<?php include __DIR__ . '/footer.php'; ?>
