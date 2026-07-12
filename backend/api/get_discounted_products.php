<?php
require_once __DIR__ . '/../includes/cors.php';
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../includes/db.php';

$result = $conn->query("SELECT id, name, price, discount, size FROM products WHERE discount > 0 ORDER BY discount DESC LIMIT 100");
$products = [];
while ($row = $result->fetch_assoc()) {
    $productId = $row['id'];
    $discount = (int)$row['discount'];
    $price = (float)$row['price'];
    
    // Fetch first image
    $images_stmt = $conn->prepare('SELECT image FROM product_images WHERE product_id = ? LIMIT 1');
    $images_stmt->bind_param('s', $productId);
    $images_stmt->execute();
    $images_result = $images_stmt->get_result();
    $image_row = $images_result->fetch_assoc();
    $image = $image_row['image'] ?? null;
    $images_stmt->close();

    $products[] = [
        'id'               => $row['id'],
        'name'             => $row['name'],
        'price'            => $price,
        'discount'         => $discount,
        'discounted_price' => round($price * (1 - $discount / 100), 2),
        'size'             => $row['size'],
        'image'            => $image
    ];
}

echo json_encode(['status' => 'success', 'products' => $products, 'total' => count($products)], JSON_UNESCAPED_UNICODE);
$conn->close();
?>
