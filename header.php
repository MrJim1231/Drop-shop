<?php
/**
 * header.php — Shared PHP header included in every server-rendered page.
 * Accepts optional $meta array with keys: title, description, og_title, og_description, og_image, og_url
 */

// Sensible defaults
$page_title       = $meta['title']       ?? 'DropShop — Інтернет-магазин';
$page_description = $meta['description'] ?? 'Широкий вибір товарів з доставкою по Україні.';
$og_title         = $meta['og_title']       ?? $page_title;
$og_description   = $meta['og_description'] ?? $page_description;
$og_image         = $meta['og_image']       ?? '';
$og_url           = $meta['og_url']         ?? (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];

// Detect site base (works both locally in /course__udemy and on root shared hosting)
$script_dir = dirname($_SERVER['SCRIPT_NAME']);
$base        = ($script_dir === '/' || $script_dir === '\\') ? '' : rtrim($script_dir, '/\\');
// Assets live in /frontend/dist/assets/ relative to this file
$asset_base = $base . '/frontend/dist';
?>
<!doctype html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><?= htmlspecialchars($page_title) ?></title>
  <meta name="description" content="<?= htmlspecialchars($page_description) ?>" />
  <meta name="robots" content="index, follow" />

  <!-- OpenGraph (Facebook, Telegram, Viber, WhatsApp) -->
  <meta property="og:type"        content="website" />
  <meta property="og:site_name"   content="DropShop" />
  <meta property="og:title"       content="<?= htmlspecialchars($og_title) ?>" />
  <meta property="og:description" content="<?= htmlspecialchars($og_description) ?>" />
  <meta property="og:url"         content="<?= htmlspecialchars($og_url) ?>" />
  <?php if ($og_image): ?>
  <meta property="og:image"       content="<?= htmlspecialchars($og_image) ?>" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <?php endif; ?>

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="<?= htmlspecialchars($og_title) ?>" />
  <meta name="twitter:description" content="<?= htmlspecialchars($og_description) ?>" />
  <?php if ($og_image): ?>
  <meta name="twitter:image" content="<?= htmlspecialchars($og_image) ?>" />
  <?php endif; ?>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

  <!-- Vite compiled CSS (production) -->
  <?php
    // Find the compiled CSS file dynamically from manifest
    $manifest_path = __DIR__ . '/frontend/dist/.vite/manifest.json';
    $css_file = '';
    $js_file  = '';
    if (file_exists($manifest_path)) {
      $manifest = json_decode(file_get_contents($manifest_path), true);
      foreach ($manifest as $entry) {
        if (!empty($entry['isEntry'])) {
          $js_file  = $asset_base . '/' . $entry['file'];
          $css_file = !empty($entry['css']) ? $asset_base . '/' . $entry['css'][0] : '';
        }
      }
    }
  ?>
  <?php if ($css_file): ?>
  <link rel="stylesheet" href="<?= htmlspecialchars($css_file) ?>" />
  <?php endif; ?>

  <!-- Dark-mode flash prevention -->
  <script>
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    }
  </script>
</head>
<body>
  <!-- PHP server-rendered content is injected from each page template. -->
  <!-- The SPA shell will be mounted in #spa-shell for interactive parts. -->
