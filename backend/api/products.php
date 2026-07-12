<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Подключаем файл с подключением к базе данных
require_once __DIR__ . '/../includes/db.php';

// Получаем параметры пагинации из запроса
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1; // Текущая страница
$limit = 20; // Количество товаров на странице
$offset = ($page - 1) * $limit; // Вычисляем смещение

// Запрос для получения товаров с учетом пагинации
$sql = "SELECT * FROM products LIMIT $limit OFFSET $offset";
$result = $conn->query($sql);

$products = [];
while ($row = $result->fetch_assoc()) {
    $products[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'description' => $row['description'],
        'price' => $row['price'],
        'image' => $row['image'],
        'size' => $row['size'],
        'availability' => $row['availability'],
        'quantity_in_stock' => $row['quantity_in_stock'],
        'weight' => $row['weight'],
        'category_id' => $row['category_id']
    ];
}

// Получаем общее количество товаров для вычисления общего количества страниц
$sql_total = "SELECT COUNT(*) AS total FROM products";
$result_total = $conn->query($sql_total);
$row_total = $result_total->fetch_assoc();
$total_items = $row_total['total'];
$total_pages = ceil($total_items / $limit);

// Отправляем данные в формате JSON
echo json_encode(['products' => $products, 'total_pages' => $total_pages], JSON_UNESCAPED_UNICODE);
?>
