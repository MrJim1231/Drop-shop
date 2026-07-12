<?php
/**
 * Імпорт товарів з XML/YML за посиланням (opt-drop та сумісні формати)
 *
 * Категорії беруться 1:1 з XML з урахуванням ієрархії (parentId).
 * Товари отримують свій оригінальний categoryId з XML.
 *
 * http://localhost/course__udemy/backend/scripts/import_xml.php?url=https://opt-drop.com/storage/xml/opt-drop-0.xml
 * http://localhost/course__udemy/backend/scripts/import_xml.php?url=...&reset=1
 * http://localhost/course__udemy/backend/scripts/import_xml.php?url=...&reset=1&markup=20
 */

declare(strict_types=1);

set_time_limit(0);
ini_set('memory_limit', '512M');

header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/category_helpers.php';

$startedAt = microtime(true);
$isReset   = isset($_GET['reset']);
$url       = isset($_GET['url']) ? trim($_GET['url']) : '';

echo '<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><title>Імпорт XML каталогу</title>';
echo '<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#1e293b}';
echo '.ok{color:#059669}.warn{color:#d97706}.err{color:#dc2626}table{border-collapse:collapse;width:100%;margin:16px 0}';
echo 'td,th{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}th{background:#f8fafc}</style></head><body>';
echo '<h1>Імпорт каталогу DropShop (XML/YML)</h1>';

function flushOutput(): void
{
    if (ob_get_level() > 0) {
        ob_flush();
    }
    flush();
}

flushOutput();

if ($url === '') {
    die('<p class="err">Помилка: не вказано посилання на XML файл (параметр ?url=)</p></body></html>');
}

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

echo '<p>Завантажую XML файл: <strong>' . htmlspecialchars($url) . '</strong>...</p>';
flushOutput();

// --- Завантажуємо XML ---
$xmlContent = file_get_contents($url);
if ($xmlContent === false) {
    die('<p class="err">Помилка: не вдалося завантажити XML файл. Перевірте посилання та доступ до інтернету.</p></body></html>');
}

echo '<p>Аналізую XML структуру...</p>';
flushOutput();

try {
    $xml = simplexml_load_string($xmlContent);
    if ($xml === false) {
        throw new RuntimeException('Невірний формат XML.');
    }
} catch (Throwable $e) {
    die('<p class="err">Помилка парсингу XML: ' . htmlspecialchars($e->getMessage()) . '</p></body></html>');
}

$shopName = (string)($xml->shop->name ?? 'Невідомий постачальник');
echo '<p>Постачальник: <strong>' . htmlspecialchars($shopName) . '</strong></p>';
flushOutput();

$stats = [
    'categories_created' => 0,
    'products_added'     => 0,
    'products_updated'   => 0,
    'images_added'       => 0,
    'skipped'            => 0,
    'errors'             => [],
];

// -----------------------------------------------------------------------
// --- 1. ІМПОРТ КАТЕГОРІЙ з XML (1:1, зі збереженням ієрархії) ---
// -----------------------------------------------------------------------
$xmlCategories = $xml->shop->categories->category ?? [];
$totalCats     = count($xmlCategories);
echo "<p>Імпорт {$totalCats} категорій з XML...</p>";
flushOutput();

// Вимикаємо FK щоб вставляти в будь-якому порядку (дочірні можуть бути раніше батьків)
$mysqli->query('SET FOREIGN_KEY_CHECKS = 0');

$stmtCat = $mysqli->prepare(
    'INSERT INTO categories (id, name, parent_id) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id)'
);

foreach ($xmlCategories as $cat) {
    $id   = (int) $cat['id'];
    $name = trim((string) $cat);

    // parentId може бути як parentId так і parent_id залежно від постачальника
    $parentId = null;
    if (isset($cat['parentId']) && (int)$cat['parentId'] > 0) {
        $parentId = (int) $cat['parentId'];
    } elseif (isset($cat['parent_id']) && (int)$cat['parent_id'] > 0) {
        $parentId = (int) $cat['parent_id'];
    }

    if ($id <= 0 || $name === '') {
        continue;
    }

    $stmtCat->bind_param('isi', $id, $name, $parentId);
    $stmtCat->execute();
    $stats['categories_created']++;
}

$stmtCat->close();
$mysqli->query('SET FOREIGN_KEY_CHECKS = 1');

echo '<p class="ok">Категорії успішно імпортовано.</p>';
flushOutput();

// -----------------------------------------------------------------------
// --- 2. ІМПОРТ ТОВАРІВ (category_id береться з XML, без маппінгу) ---
// -----------------------------------------------------------------------
$offers      = $xml->shop->offers->offer ?? [];
$totalOffers = count($offers);
echo "<p>Імпорт {$totalOffers} товарів...</p><ul id='progress'>";
flushOutput();

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

$mysqli->begin_transaction();

try {
    $i = 0;
    foreach ($offers as $offer) {
        $i++;

        // SKU: спочатку vendorCode, потім id атрибут
        $sku = trim((string) $offer->vendorCode);
        if ($sku === '') {
            $sku = trim((string) $offer['id']);
        }
        if ($sku === '') {
            $stats['skipped']++;
            continue;
        }

        // Назва: пріоритет українська
        $name = trim((string) $offer->name_ua);
        if ($name === '') {
            $name = trim((string) $offer->name);
        }

        // Опис: пріоритет українська
        $description = trim((string) $offer->description_ua);
        if ($description === '') {
            $description = trim((string) $offer->description);
        }

        // Ціна
        $price  = (float) $offer->price;
        $markup = isset($_GET['markup']) ? (float)$_GET['markup'] : 0.0;
        if ($markup > 0) {
            $price = round($price * (1 + $markup / 100), 2);
        }

        // Category ID з XML (оригінальний)
        $categoryId = (int) $offer->categoryId;

        // Доступність
        $availableAttr = strtolower(trim((string) $offer['available']));
        $availability  = ($availableAttr === 'true' || $availableAttr === '1') ? 1 : 0;

        $quantity = isset($offer->quantity_in_stock) ? (int) $offer->quantity_in_stock : ($availability ? 1 : 0);
        if ($quantity <= 0 && $availability === 1) {
            $quantity = 1;
        }

        // Пропускаємо якщо немає назви або ціни
        if ($name === '' || $price <= 0) {
            $stats['skipped']++;
            if (count($stats['errors']) < 50) {
                $stats['errors'][] = "SKU={$sku}: порожня назва або нульова ціна";
            }
            continue;
        }

        // Якщо categoryId не знайдено в XML — пропускаємо або ставимо 0
        // (FK вже включені, тому невалідний categoryId дасть помилку)
        // Але categoryId=0 дозволено (NULL-able FK)
        if ($categoryId <= 0) {
            $categoryId = null; // null замість невалідного ID
        }

        $upsertProduct->bind_param('sissdiis',
            $sku, $categoryId, $name, $description, $price,
            $availability, $quantity, $shopName
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

        // Зображення
        $images = [];
        foreach ($offer->picture as $pic) {
            $picUrl = trim((string) $pic);
            if ($picUrl !== '' && !in_array($picUrl, $images, true)) {
                $images[] = $picUrl;
            }
        }
        foreach ($images as $image) {
            $insertImage->bind_param('ss', $sku, $image);
            $insertImage->execute();
            $stats['images_added']++;
        }

        if ($i % 200 === 0) {
            echo '<li>Оброблено ' . $i . ' / ' . $totalOffers . '...</li>';
            flushOutput();
        }
    }

    $mysqli->commit();
} catch (Throwable $e) {
    $mysqli->rollback();
    echo '</ul><p class="err">Помилка імпорту: ' . htmlspecialchars($e->getMessage()) . '</p></body></html>';
    exit;
}

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
        (SELECT COUNT(*) FROM categories)     AS categories_total,
        (SELECT COUNT(*) FROM products)       AS products_total,
        (SELECT COUNT(*) FROM product_images) AS images_total
")->fetch_assoc();

$elapsed = round(microtime(true) - $startedAt, 1);
$mysqli->close();

echo '<h2 class="ok">Імпорт завершено за ' . $elapsed . ' сек.</h2>';

echo '<table><tr><th>Показник</th><th>Значення</th></tr>';
echo '<tr><td>Товарів оброблено в XML</td><td>' . $totalOffers . '</td></tr>';
echo '<tr><td>Категорій створено/оновлено</td><td>' . $stats['categories_created'] . '</td></tr>';
echo '<tr><td><strong>Всього категорій у БД</strong></td><td><strong>' . (int) $counts['categories_total'] . '</strong></td></tr>';
echo '<tr><td>Товарів додано</td><td class="ok">' . $stats['products_added'] . '</td></tr>';
echo '<tr><td>Товарів оновлено</td><td>' . $stats['products_updated'] . '</td></tr>';
echo '<tr><td><strong>Всього товарів у БД</strong></td><td><strong>' . (int) $counts['products_total'] . '</strong></td></tr>';
echo '<tr><td>Зображень додано</td><td>' . $stats['images_added'] . '</td></tr>';
echo '<tr><td><strong>Всього зображень у БД</strong></td><td><strong>' . (int) $counts['images_total'] . '</strong></td></tr>';
echo '<tr><td>Пропущено товарів</td><td>' . $stats['skipped'] . '</td></tr>';
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
