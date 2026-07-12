<?php
// Разрешаем доступ с любого источника
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Проверяем preflight-запрос (OPTIONS) и завершаем выполнение, если он есть
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Подключаем файл с подключением к базе данных
require_once __DIR__ . '/../includes/db.php';

// Получаем category_id из GET-запроса
$category_id = isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0;

if ($category_id > 0) {
    // Получаем все подкатегории для выбранной категории
    $subcategories_query = "SELECT id FROM categories WHERE parent_id = ?";
    $stmt = $conn->prepare($subcategories_query);
    $stmt->bind_param('i', $category_id);
    $stmt->execute();
    $subcategories_result = $stmt->get_result();

    // Формируем список всех категорий, включая подкатегории
    $all_categories = [$category_id];
    while ($subcategory = $subcategories_result->fetch_assoc()) {
        $all_categories[] = $subcategory['id'];
    }

    // Преобразуем массив в строку для SQL-запроса
    $categories_list = implode(',', $all_categories);

    // Запрос на получение товаров для всех выбранных категорий, только с доступностью
    $query = "SELECT * FROM products WHERE category_id IN ($categories_list) AND availability = 1";
    $result = $conn->query($query);

    $products = [];
    $exclude_sizes = [
        'Бязь (Кінцева вартість буде після прорахунків індивідуальних розмірів)',
        'Ранфорс (Кінцева вартість буде після прорахунків індивідуальних розмірів)',
        'Сатин (Кінцева вартість буде після прорахунків індивідуальних розмірів)',
        'Страйп сатин (Кінцева вартість буде після прорахунків індивідуальних розмірів)',
        'Полікотон (Кінцева вартість буде після прорахунків індивідуальних розмірів)',
        'Однотонна бязь (Кінцева вартість буде після прорахунків індивідуальних розмірів)'
    ];

    while ($row = $result->fetch_assoc()) {
        // Фильтруем товары, исключая те, у которых размер в списке исключенных
        if (!in_array($row['size'], $exclude_sizes)) {
            // Получаем изображения для товара
            $product_id = $row['id'];
            $images_query = "SELECT image FROM product_images WHERE product_id = ?";
            $images_stmt = $conn->prepare($images_query);
            $images_stmt->bind_param('s', $product_id);
            $images_stmt->execute();
            $images_result = $images_stmt->get_result();

            // Собираем все изображения для товара в массив
            $images = [];
            while ($image_row = $images_result->fetch_assoc()) {
                $images[] = $image_row['image'];
            }

            // Добавляем изображения к товару
            $row['images'] = $images;

            // Добавляем товар в список
            $products[] = $row;
        }
    }

    echo json_encode($products);
} else {
    echo json_encode(["error" => "Invalid category ID"]);
}
?>
