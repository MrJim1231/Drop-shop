<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../includes/db.php';

// Запрос к базе данных для получения всех категорий, исключая указанные
$sql = "SELECT id, name FROM categories WHERE name NOT IN ('Постільна білизна', 'Півтора-спальний', 'Двоспальний', 'Евро', 'Євро', 'Сімейний', 'Індивідуальний пошив','Іедивідуальний пошив')";
$result = $conn->query($sql);

$categories = [];
while ($row = $result->fetch_assoc()) {
    $category = $row;
    $category_id = $row['id'];

    // Логируем обработку категории
    error_log("Обрабатываем категорию ID: " . $category_id);

    // Запрос к базе данных для получения изображения из product_images
    $sql_product = "
        SELECT pi.image 
        FROM product_images pi
        JOIN products p ON pi.product_id = p.id
        WHERE p.category_id IN (SELECT id FROM categories WHERE parent_id = ?) 
        LIMIT 1
    ";
    $stmt = $conn->prepare($sql_product);

    if (!$stmt) {
        error_log("Ошибка подготовки запроса: " . $conn->error);
        continue;
    }

    $stmt->bind_param('i', $category_id);
    $stmt->execute();
    $product_result = $stmt->get_result();
    $product = $product_result->fetch_assoc();

    if ($product && !empty($product['image'])) {
        error_log("Нашли картинку товара для категории $category_id: " . $product['image']);
        $category['image'] = $product['image'];
    } else {
        error_log("Не нашли картинку товара для категории $category_id. Используем дефолт.");
        $category['image'] = 'images/default-category.jpg';
    }

    $categories[] = $category;
}

echo json_encode($categories, JSON_UNESCAPED_UNICODE);
?>
