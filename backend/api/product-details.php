<?php
require_once __DIR__ . '/../includes/cors.php';
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../includes/db.php';

$product_id = isset($_GET['id']) ? trim($_GET['id']) : '';

if ($product_id === '') {
    http_response_code(400);
    echo json_encode(['message' => 'Product ID is required'], JSON_UNESCAPED_UNICODE);
    exit();
}

$query = "SELECT products.*, categories.name AS category_name, categories.parent_id
          FROM products
          JOIN categories ON products.category_id = categories.id
          WHERE products.id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('s', $product_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['message' => 'Product not found'], JSON_UNESCAPED_UNICODE);
    exit();
}

$product = $result->fetch_assoc();
$stmt->close();

$images_query = "SELECT image FROM product_images WHERE product_id = ? ORDER BY id";
$images_stmt = $conn->prepare($images_query);
$images_stmt->bind_param('s', $product_id);
$images_stmt->execute();
$images_result = $images_stmt->get_result();

$images = [];
while ($image_row = $images_result->fetch_assoc()) {
    $images[] = $image_row['image'];
}
$images_stmt->close();

$product['images'] = $images;
$product['image'] = $images[0] ?? null;
$product['sizes'] = [];

echo json_encode($product, JSON_UNESCAPED_UNICODE);
