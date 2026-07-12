<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../includes/db.php';

$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
$limit = 20;
$offset = ($page - 1) * $limit;

$sql = "SELECT p.* FROM products p ORDER BY p.name LIMIT $limit OFFSET $offset";
$result = $conn->query($sql);

$products = [];
while ($row = $result->fetch_assoc()) {
    $productId = $row['id'];
    $images = [];

    $images_stmt = $conn->prepare('SELECT image FROM product_images WHERE product_id = ?');
    $images_stmt->bind_param('s', $productId);
    $images_stmt->execute();
    $images_result = $images_stmt->get_result();

    while ($image_row = $images_result->fetch_assoc()) {
        $images[] = $image_row['image'];
    }
    $images_stmt->close();

    $products[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'description' => $row['description'],
        'price' => $row['price'],
        'image' => $images[0] ?? null,
        'images' => $images,
        'size' => $row['size'],
        'availability' => $row['availability'],
        'quantity_in_stock' => $row['quantity_in_stock'],
        'weight' => $row['weight'],
        'category_id' => $row['category_id'],
    ];
}

$result_total = $conn->query('SELECT COUNT(*) AS total FROM products');
$row_total = $result_total->fetch_assoc();
$total_items = (int) $row_total['total'];
$total_pages = (int) ceil($total_items / $limit);

echo json_encode(['products' => $products, 'total_pages' => $total_pages], JSON_UNESCAPED_UNICODE);
