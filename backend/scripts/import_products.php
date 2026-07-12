<?php
/**
 * Імпорт товарів з Excel (catalog_dropt_*.xlsx)
 *
 * Категорії беруться 1:1 з колонки "Категорії" Excel — без жодного маппінгу.
 *
 * http://localhost/course__udemy/backend/scripts/import_products.php
 * http://localhost/course__udemy/backend/scripts/import_products.php?reset=1
 * http://localhost/course__udemy/backend/scripts/import_products.php?reset=1&markup=20
 */

declare(strict_types=1);

set_time_limit(0);
ini_set('memory_limit', '512M');

header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/SimpleXlsxReader.php';
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/category_helpers.php';

$startedAt = microtime(true);
$isReset   = isset($_GET['reset']);

echo '<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><title>Імпорт каталогу</title>';
echo '<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#1e293b}';
echo '.ok{color:#059669}.warn{color:#d97706}.err{color:#dc2626}table{border-collapse:collapse;width:100%;margin:16px 0}';
echo 'td,th{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}th{background:#f8fafc}</style></head><body>';
echo '<h1>Імпорт каталогу DropShop (Excel)</h1>';

flushOutput();

$mysqli = new mysqli(DB_HOSTNAME, DB_USERNAME, DB_PASSWORD, DB_DATABASE);
$mysqli->set_charset('utf8mb4');

if ($mysqli->connect_error) {
    die('<p class="err">Помилка підключення до БД: ' . htmlspecialchars($mysqli->connect_error) . '</p></body></html>');
}

// --- Reset ---
if ($isReset) {
    $mysqli->query('SET FOREIGN_KEY_CHECKS = 0');
    $mysqli->query('TRUNCATE TABLE product_images');
    $mysqli->query('TRUNCATE TABLE products');
    $mysqli->query('TRUNCATE TABLE categories');
    $mysqli->query('SET FOREIGN_KEY_CHECKS = 1');
    echo '<p class="warn">Таблиці <strong>categories</strong>, <strong>products</strong>, <strong>product_images</strong> очищено.</p>';
    flushOutput();
}

// --- Файл ---
$fileName    = isset($_GET['file']) ? $_GET['file'] : 'catalog_dropt_2026-07-12.xlsx';
$fileName    = basename($fileName);
$catalogFile = dirname(__DIR__, 2) . '/' . $fileName;

if (!file_exists($catalogFile)) {
    die('<p class="err">Файл не знайдено: ' . htmlspecialchars($fileName) . '</p></body></html>');
}

echo '<p>Читаю Excel-файл <strong>' . htmlspecialchars($fileName) . '</strong>...</p>';
flushOutput();

try {
    $rows = SimpleXlsxReader::readRows($catalogFile);
} catch (Throwable $e) {
    die('<p class="err">Помилка читання XLSX: ' . htmlspecialchars($e->getMessage()) . '</p></body></html>');
}

if (count($rows) < 2) {
    die('<p class="err">Файл порожній або без даних.</p></body></html>');
}

$headers   = array_map('trim', $rows[0]);
$columnMap = buildColumnMap($headers);
$totalRows = count($rows) - 1;

$stats = [
    'total_rows'         => $totalRows,
    'categories_created' => 0,
    'products_added'     => 0,
    'products_updated'   => 0,
    'images_added'       => 0,
    'skipped'            => 0,
    'errors'             => [],
];

// --- Кеш категорій: name → id ---
// Категорії в Excel — плоскі (один рівень), parent_id = NULL.
$categoryCache  = []; // ['Назва категорії' => id]
$nextCategoryId = 1;

if (!$isReset) {
    $result         = $mysqli->query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM categories');
    $nextCategoryId = (int) ($result->fetch_assoc()['next_id'] ?? 1);
    // Будуємо кеш за назвою
    $res = $mysqli->query('SELECT id, name FROM categories');
    while ($row = $res->fetch_assoc()) {
        $categoryCache[trim($row['name'])] = (int) $row['id'];
    }
}

$stmtInsertCat = $mysqli->prepare(
    'INSERT INTO categories (id, name, parent_id) VALUES (?, ?, NULL)
     ON DUPLICATE KEY UPDATE name = VALUES(name)'
);

$upsertProduct = $mysqli->prepare(
    'INSERT INTO products (id, group_id, category_id, name, description, price, size, availability, quantity_in_stock, weight, supplier)
     VALUES (?, NULL, ?, ?, ?, ?, NULL, ?, ?, NULL, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       description = VALUES(description),
       price = VALUES(price),
       category_id = VALUES(category_id),
       availability = VALUES(availability),
       quantity_in_stock = VALUES(quantity_in_stock),
       supplier = VALUES(supplier)'
);

$insertImage  = $mysqli->prepare('INSERT INTO product_images (product_id, image) VALUES (?, ?)');
$deleteImages = $mysqli->prepare('DELETE FROM product_images WHERE product_id = ?');

echo "<p>Імпорт {$totalRows} товарів...</p><ul id='progress'>";
flushOutput();

$mysqli->begin_transaction();

try {
    for ($i = 1; $i < count($rows); $i++) {
        $row = normalizeRow($rows[$i], count($headers));

        $sku = trim(getCell($row, $columnMap, 'sku'));
        if ($sku === '') {
            $stats['skipped']++;
            continue;
        }

        $name        = trim(getCell($row, $columnMap, 'name_uk'));
        $description = trim(getCell($row, $columnMap, 'desc_uk'));
        $price       = parsePrice(getCell($row, $columnMap, 'price'));

        $markup = isset($_GET['markup']) ? (float)$_GET['markup'] : 0.0;
        if ($markup > 0) {
            $price = round($price * (1 + $markup / 100), 2);
        }

        $categoryName    = trim(getCell($row, $columnMap, 'category'));
        $availabilityText = trim(getCell($row, $columnMap, 'availability'));
        $mainImage       = trim(getCell($row, $columnMap, 'main_image'));
        $extraImages     = trim(getCell($row, $columnMap, 'extra_images'));

        if ($name === '' || $price <= 0 || $categoryName === '') {
            $stats['skipped']++;
            if (count($stats['errors']) < 50) {
                $stats['errors'][] = "Рядок {$i}: пропущено, SKU={$sku}";
            }
            continue;
        }

        // --- Категорія: шукаємо або створюємо за назвою ---
        if (!isset($categoryCache[$categoryName])) {
            $catId = $nextCategoryId++;
            $stmtInsertCat->bind_param('is', $catId, $categoryName);
            $stmtInsertCat->execute();
            $categoryCache[$categoryName] = $catId;
            $stats['categories_created']++;
        }
        $categoryId = $categoryCache[$categoryName];

        $availability    = isAvailable($availabilityText) ? 1 : 0;
        $quantityInStock = $availability ? 1 : 0;

        $upsertProduct->bind_param('sissdiis',
            $sku, $categoryId, $name, $description, $price,
            $availability, $quantityInStock, $fileName
        );
        $upsertProduct->execute();

        $affected = $upsertProduct->affected_rows;
        if ($affected === 1) {
            $stats['products_added']++;
        } elseif ($affected === 2) {
            $stats['products_updated']++;
        }

        if (!$isReset) {
            $deleteImages->bind_param('s', $sku);
            $deleteImages->execute();
        }

        $images = collectImages($mainImage, $extraImages);
        foreach ($images as $image) {
            $insertImage->bind_param('ss', $sku, $image);
            $insertImage->execute();
            $stats['images_added']++;
        }

        if ($i % 200 === 0) {
            echo '<li>Оброблено ' . $i . ' / ' . $totalRows . '...</li>';
            flushOutput();
        }
    }

    $mysqli->commit();
} catch (Throwable $e) {
    $mysqli->rollback();
    echo '</ul><p class="err">Помилка імпорту: ' . htmlspecialchars($e->getMessage()) . '</p></body></html>';
    exit;
}

$stmtInsertCat->close();
$upsertProduct->close();
$insertImage->close();
$deleteImages->close();

echo '</ul><p>Оновлюю зображення категорій...</p>';
flushOutput();

$mysqli->query("
    UPDATE categories c
    JOIN (
        SELECT p.category_id, MIN(pi.image) AS image
        FROM products p
        INNER JOIN product_images pi ON pi.product_id = p.id
        GROUP BY p.category_id
    ) src ON c.id = src.category_id
    SET c.image = src.image
    WHERE c.image IS NULL OR c.image = ''
");

$counts = $mysqli->query("
    SELECT
        (SELECT COUNT(*) FROM categories) AS categories_total,
        (SELECT COUNT(*) FROM products)   AS products_total,
        (SELECT COUNT(*) FROM product_images) AS images_total
")->fetch_assoc();

$elapsed = round(microtime(true) - $startedAt, 1);
$mysqli->close();

echo '<h2 class="ok">Імпорт завершено за ' . $elapsed . ' сек.</h2>';

echo '<table><tr><th>Показник</th><th>Значення</th></tr>';
echo '<tr><td>Рядків у Excel-файлі</td><td>' . $stats['total_rows'] . '</td></tr>';
echo '<tr><td>Категорій створено за цей запуск</td><td>' . $stats['categories_created'] . '</td></tr>';
echo '<tr><td><strong>Всього категорій у БД</strong></td><td><strong>' . (int) $counts['categories_total'] . '</strong></td></tr>';
echo '<tr><td>Товарів додано</td><td class="ok">' . $stats['products_added'] . '</td></tr>';
echo '<tr><td>Товарів оновлено</td><td>' . $stats['products_updated'] . '</td></tr>';
echo '<tr><td><strong>Всього товарів у БД</strong></td><td><strong>' . (int) $counts['products_total'] . '</strong></td></tr>';
echo '<tr><td>Зображень додано</td><td>' . $stats['images_added'] . '</td></tr>';
echo '<tr><td><strong>Всього зображень у БД</strong></td><td><strong>' . (int) $counts['images_total'] . '</strong></td></tr>';
echo '<tr><td>Пропущено рядків</td><td>' . $stats['skipped'] . '</td></tr>';
echo '</table>';

if ($stats['errors'] !== []) {
    echo '<h3>Попередження (перші 20)</h3><ul>';
    foreach (array_slice($stats['errors'], 0, 20) as $error) {
        echo '<li>' . htmlspecialchars($error) . '</li>';
    }
    echo '</ul>';
}

echo '<p><a href="/course__udemy/frontend/">Перейти на сайт</a></p>';
echo '</body></html>';

// ------------------------------------------------------------------

function flushOutput(): void
{
    if (ob_get_level() > 0) {
        ob_flush();
    }
    flush();
}

function buildColumnMap(array $headers): array
{
    $map = [];

    foreach ($headers as $index => $header) {
        $normalized = mb_strtolower(trim($header));

        if ($header === 'SKU') {
            $map['sku'] = $index;
        } elseif (str_contains($normalized, 'назва') && str_contains($normalized, 'укр')) {
            $map['name_uk'] = $index;
        } elseif (str_contains($normalized, 'опис') && str_contains($normalized, 'укр')) {
            $map['desc_uk'] = $index;
        } elseif (str_contains($normalized, 'дроп') && str_contains($normalized, 'ціна')) {
            $map['price'] = $index;
        } elseif ($normalized === 'категорії' || $normalized === 'категории') {
            $map['category'] = $index;
        } elseif ($normalized === 'наявність' || $normalized === 'наличие') {
            $map['availability'] = $index;
        } elseif (str_contains($normalized, 'головне фото')) {
            $map['main_image'] = $index;
        } elseif (str_contains($normalized, 'додаткові фото') || str_contains($normalized, 'дополнительные фото')) {
            $map['extra_images'] = $index;
        }
    }

    foreach (['sku', 'name_uk', 'price', 'category', 'main_image'] as $key) {
        if (!isset($map[$key])) {
            throw new RuntimeException("У файлі Excel не знайдено колонку: {$key}");
        }
    }

    return $map;
}

function normalizeRow(array $row, int $expectedColumns): array
{
    return count($row) >= $expectedColumns ? $row : array_pad($row, $expectedColumns, '');
}

function getCell(array $row, array $map, string $key): string
{
    return isset($map[$key]) ? ($row[$map[$key]] ?? '') : '';
}

function parsePrice(string $value): float
{
    return round((float) str_replace(',', '.', trim($value)), 2);
}

function isAvailable(string $text): bool
{
    $text = mb_strtolower(trim($text));
    return $text === '' || str_contains($text, 'наявн') || str_contains($text, 'налич');
}

function collectImages(string $mainImage, string $extraImages): array
{
    $images = [];

    if ($mainImage !== '') {
        $images[] = $mainImage;
    }

    if ($extraImages !== '') {
        foreach (preg_split('/\s*\|\s*/', $extraImages) ?: [] as $image) {
            $image = trim($image);
            if ($image !== '' && !in_array($image, $images, true)) {
                $images[] = $image;
            }
        }
    }

    return $images;
}
