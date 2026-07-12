<?php
/**
 * Імпорт товарів з Excel-файлу catalog_dropt_*.xlsx
 *
 * Запуск:
 *   http://localhost/course__udemy/backend/scripts/import_products.php
 *   http://localhost/course__udemy/backend/scripts/import_products.php?reset=1  — очистити таблиці перед імпортом
 */

declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/SimpleXlsxReader.php';
require_once __DIR__ . '/../config.php';

$mysqli = new mysqli(DB_HOSTNAME, DB_USERNAME, DB_PASSWORD, DB_DATABASE);
$mysqli->set_charset('utf8mb4');

if ($mysqli->connect_error) {
    die('Помилка підключення до БД: ' . $mysqli->connect_error);
}

$catalogFile = dirname(__DIR__, 2) . '/catalog_dropt_2026-07-12.xlsx';

if (!file_exists($catalogFile)) {
    die('Файл каталогу не знайдено: catalog_dropt_2026-07-12.xlsx (має бути в корені проекту)');
}

if (isset($_GET['reset'])) {
    $mysqli->query('SET FOREIGN_KEY_CHECKS = 0');
    $mysqli->query('TRUNCATE TABLE product_images');
    $mysqli->query('TRUNCATE TABLE products');
    $mysqli->query('TRUNCATE TABLE categories');
    $mysqli->query('SET FOREIGN_KEY_CHECKS = 1');
    echo '<p><strong>Таблиці categories, products, product_images очищено.</strong></p>';
}

try {
    $rows = SimpleXlsxReader::readRows($catalogFile);
} catch (Throwable $e) {
    die('Помилка читання XLSX: ' . htmlspecialchars($e->getMessage()));
}

if (count($rows) < 2) {
    die('Файл каталогу порожній або містить лише заголовки');
}

$headers = array_map('trim', $rows[0]);
$columnMap = buildColumnMap($headers);

$stats = [
    'total_rows' => count($rows) - 1,
    'categories_created' => 0,
    'products_added' => 0,
    'products_updated' => 0,
    'images_added' => 0,
    'skipped' => 0,
    'errors' => [],
];

$categoryCache = loadCategoryCache($mysqli);
$nextCategoryId = getNextCategoryId($mysqli, $categoryCache);

for ($i = 1; $i < count($rows); $i++) {
    $row = normalizeRow($rows[$i], count($headers));

    $sku = trim(getCell($row, $columnMap, 'sku'));
    if ($sku === '') {
        $stats['skipped']++;
        continue;
    }

    $name = trim(getCell($row, $columnMap, 'name_uk'));
    $description = trim(getCell($row, $columnMap, 'desc_uk'));
    $price = parsePrice(getCell($row, $columnMap, 'price'));
    $categoryPath = trim(getCell($row, $columnMap, 'category'));
    $availabilityText = trim(getCell($row, $columnMap, 'availability'));
    $mainImage = trim(getCell($row, $columnMap, 'main_image'));
    $extraImages = trim(getCell($row, $columnMap, 'extra_images'));

    if ($name === '' || $price <= 0 || $categoryPath === '') {
        $stats['skipped']++;
        $stats['errors'][] = "Рядок {$i}: пропущено (немає назви, ціни або категорії), SKU={$sku}";
        continue;
    }

    $categoryId = resolveCategoryPath($mysqli, $categoryPath, $categoryCache, $nextCategoryId, $stats);
    $availability = isAvailable($availabilityText) ? 1 : 0;
    $quantity = $availability ? 1 : 0;

    $existing = findProduct($mysqli, $sku);

    if ($existing === null) {
        insertProduct($mysqli, $sku, $name, $description, $price, $categoryId, $availability, $quantity);
        $stats['products_added']++;
    } else {
        updateProduct($mysqli, $sku, $name, $description, $price, $categoryId, $availability, $quantity);
        if (
            (float) $existing['price'] !== $price ||
            (int) $existing['quantity_in_stock'] !== $quantity ||
            (int) $existing['category_id'] !== $categoryId
        ) {
            $stats['products_updated']++;
        }
    }

    $imagesAdded = syncProductImages($mysqli, $sku, $mainImage, $extraImages);
    $stats['images_added'] += $imagesAdded;

    if ($mainImage !== '') {
        setCategoryImageIfEmpty($mysqli, $categoryId, $mainImage);
    }
}

$mysqli->close();

echo '<h2>Імпорт завершено</h2>';
echo '<ul>';
echo '<li>Рядків у файлі: ' . $stats['total_rows'] . '</li>';
echo '<li>Категорій створено: ' . $stats['categories_created'] . '</li>';
echo '<li>Товарів додано: ' . $stats['products_added'] . '</li>';
echo '<li>Товарів оновлено: ' . $stats['products_updated'] . '</li>';
echo '<li>Зображень додано: ' . $stats['images_added'] . '</li>';
echo '<li>Пропущено рядків: ' . $stats['skipped'] . '</li>';
echo '</ul>';

if ($stats['errors'] !== []) {
    echo '<h3>Попередження (перші 20)</h3><ul>';
    foreach (array_slice($stats['errors'], 0, 20) as $error) {
        echo '<li>' . htmlspecialchars($error) . '</li>';
    }
    echo '</ul>';
}

echo '<p><a href="/course__udemy/frontend/">Перейти на сайт</a></p>';

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

    $required = ['sku', 'name_uk', 'price', 'category', 'main_image'];
    foreach ($required as $key) {
        if (!isset($map[$key])) {
            throw new RuntimeException("У файлі Excel не знайдено колонку: {$key}");
        }
    }

    return $map;
}

function normalizeRow(array $row, int $expectedColumns): array
{
    if (count($row) >= $expectedColumns) {
        return $row;
    }

    return array_pad($row, $expectedColumns, '');
}

function getCell(array $row, array $map, string $key): string
{
    if (!isset($map[$key])) {
        return '';
    }

    return $row[$map[$key]] ?? '';
}

function parsePrice(string $value): float
{
    $value = str_replace(',', '.', trim($value));
    return round((float) $value, 2);
}

function isAvailable(string $text): bool
{
    $text = mb_strtolower(trim($text));
    return $text === '' || str_contains($text, 'наявн') || str_contains($text, 'налич');
}

function loadCategoryCache(mysqli $mysqli): array
{
    $cache = [];
    $result = $mysqli->query('SELECT id FROM categories');

    while ($row = $result->fetch_assoc()) {
        $pathKey = buildCategoryPathKey((int) $row['id'], $mysqli);
        if ($pathKey !== '') {
            $cache[$pathKey] = (int) $row['id'];
        }
    }

    return $cache;
}

function buildCategoryPathKey(int $categoryId, mysqli $mysqli): string
{
    $parts = [];
    $currentId = $categoryId;
    $guard = 0;

    while ($currentId !== 0 && $guard < 20) {
        $stmt = $mysqli->prepare('SELECT id, name, parent_id FROM categories WHERE id = ?');
        $stmt->bind_param('i', $currentId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$row) {
            break;
        }

        array_unshift($parts, trim($row['name']));
        $currentId = $row['parent_id'] ? (int) $row['parent_id'] : 0;
        $guard++;
    }

    return implode(' | ', $parts);
}

function getNextCategoryId(mysqli $mysqli, array $cache): int
{
    $result = $mysqli->query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM categories');
    $row = $result->fetch_assoc();
    $maxFromDb = (int) ($row['next_id'] ?? 1);

    $maxFromCache = 0;
    foreach ($cache as $id) {
        $maxFromCache = max($maxFromCache, $id);
    }

    return max($maxFromDb, $maxFromCache + 1);
}

function resolveCategoryPath(
    mysqli $mysqli,
    string $categoryPath,
    array &$cache,
    int &$nextCategoryId,
    array &$stats
): int {
    $parts = array_values(array_filter(array_map('trim', preg_split('/\s*\|\s*/u', $categoryPath) ?: [])));

    if ($parts === []) {
        throw new RuntimeException('Порожній шлях категорії');
    }

    $parentId = null;
    $pathSoFar = '';
    $categoryId = 0;

    foreach ($parts as $part) {
        $pathSoFar = $pathSoFar === '' ? $part : $pathSoFar . ' | ' . $part;

        if (isset($cache[$pathSoFar])) {
            $categoryId = $cache[$pathSoFar];
            $parentId = $categoryId;
            continue;
        }

        $categoryId = $nextCategoryId++;
        $stmt = $mysqli->prepare('INSERT INTO categories (id, name, parent_id) VALUES (?, ?, ?)');
        $stmt->bind_param('isi', $categoryId, $part, $parentId);
        $stmt->execute();
        $stmt->close();

        $cache[$pathSoFar] = $categoryId;
        $stats['categories_created']++;
        $parentId = $categoryId;
    }

    return $categoryId;
}

function findProduct(mysqli $mysqli, string $sku): ?array
{
    $stmt = $mysqli->prepare('SELECT id, price, quantity_in_stock, category_id FROM products WHERE id = ?');
    $stmt->bind_param('s', $sku);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $row ?: null;
}

function insertProduct(
    mysqli $mysqli,
    string $sku,
    string $name,
    string $description,
    float $price,
    int $categoryId,
    int $availability,
    int $quantity
): void {
    $stmt = $mysqli->prepare(
        'INSERT INTO products (id, group_id, category_id, name, description, price, size, availability, quantity_in_stock, weight)
         VALUES (?, NULL, ?, ?, ?, ?, NULL, ?, ?, NULL)'
    );
    $stmt->bind_param('sissdii', $sku, $categoryId, $name, $description, $price, $availability, $quantity);
    $stmt->execute();
    $stmt->close();
}

function updateProduct(
    mysqli $mysqli,
    string $sku,
    string $name,
    string $description,
    float $price,
    int $categoryId,
    int $availability,
    int $quantity
): void {
    $stmt = $mysqli->prepare(
        'UPDATE products
         SET name = ?, description = ?, price = ?, category_id = ?, availability = ?, quantity_in_stock = ?
         WHERE id = ?'
    );
    $stmt->bind_param('ssdiids', $name, $description, $price, $categoryId, $availability, $quantity, $sku);
    $stmt->execute();
    $stmt->close();
}

function syncProductImages(mysqli $mysqli, string $sku, string $mainImage, string $extraImages): int
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

    $stmt = $mysqli->prepare('DELETE FROM product_images WHERE product_id = ?');
    $stmt->bind_param('s', $sku);
    $stmt->execute();
    $stmt->close();

    if ($images === []) {
        return 0;
    }

    $insert = $mysqli->prepare('INSERT INTO product_images (product_id, image) VALUES (?, ?)');
    $added = 0;

    foreach ($images as $image) {
        $insert->bind_param('ss', $sku, $image);
        $insert->execute();
        $added++;
    }

    $insert->close();

    return $added;
}

function setCategoryImageIfEmpty(mysqli $mysqli, int $categoryId, string $image): void
{
    $stmt = $mysqli->prepare(
        'UPDATE categories SET image = ? WHERE id = ? AND (image IS NULL OR image = \'\')'
    );
    $stmt->bind_param('si', $image, $categoryId);
    $stmt->execute();
    $stmt->close();
}
