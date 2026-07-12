<?php
/**
 * sitemap.php — Dynamic XML Sitemap generator
 * Google reads this file to discover all pages instantly.
 * Add to Google Search Console as: https://yourdomain.com/sitemap.php
 *
 * Outputs a valid XML sitemap containing:
 *  - Static pages (home, categories, deals)
 *  - All root categories
 *  - All subcategories
 *  - All products (id + slug URL)
 */

require_once __DIR__ . '/backend/includes/db.php';

function slugify_sitemap($str) {
    $str = mb_strtolower(trim($str));
    $str = preg_replace('/\s+/', '-', $str);
    $str = preg_replace('/[^a-z0-9\-\p{L}]/u', '', $str);
    return $str;
}

// Detect base URL
$scheme   = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
$host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
$script   = dirname($_SERVER['SCRIPT_NAME']);
$base_url = $scheme . '://' . $host . rtrim($script === '/' ? '' : $script, '/');

// ─── Collect URLs ────────────────────────────────────────────────────────────
$urls = [];

// Static pages
$static = [
    ['loc' => $base_url . '/',           'priority' => '1.0',  'changefreq' => 'daily'],
    ['loc' => $base_url . '/categories', 'priority' => '0.9',  'changefreq' => 'weekly'],
    ['loc' => $base_url . '/deals',      'priority' => '0.8',  'changefreq' => 'daily'],
];
foreach ($static as $s) $urls[] = $s;

// Categories
$cat_result = $conn->query("SELECT id, name FROM categories ORDER BY name");
if ($cat_result) {
    while ($row = $cat_result->fetch_assoc()) {
        $urls[] = [
            'loc'        => $base_url . '/category/' . $row['id'] . '-' . slugify_sitemap($row['name']),
            'priority'   => '0.7',
            'changefreq' => 'weekly',
        ];
    }
}

// Products
$prod_result = $conn->query("SELECT id, name, updated_at FROM products ORDER BY id DESC LIMIT 10000");
if ($prod_result) {
    while ($row = $prod_result->fetch_assoc()) {
        $lastmod = !empty($row['updated_at']) ? date('Y-m-d', strtotime($row['updated_at'])) : date('Y-m-d');
        $urls[] = [
            'loc'        => $base_url . '/product/' . $row['id'] . '-' . slugify_sitemap($row['name']),
            'lastmod'    => $lastmod,
            'priority'   => '0.8',
            'changefreq' => 'weekly',
        ];
    }
}

$conn->close();

// ─── Output XML ──────────────────────────────────────────────────────────────
header('Content-Type: application/xml; charset=utf-8');
header('X-Robots-Tag: noindex');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

foreach ($urls as $url) {
    echo "  <url>\n";
    echo "    <loc>" . htmlspecialchars($url['loc']) . "</loc>\n";
    if (!empty($url['lastmod'])) {
        echo "    <lastmod>" . htmlspecialchars($url['lastmod']) . "</lastmod>\n";
    }
    echo "    <changefreq>" . htmlspecialchars($url['changefreq']) . "</changefreq>\n";
    echo "    <priority>" . htmlspecialchars($url['priority']) . "</priority>\n";
    echo "  </url>\n";
}

echo '</urlset>';
?>
