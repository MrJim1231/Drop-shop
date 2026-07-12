<?php
require_once __DIR__ . '/../includes/cors.php';
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$product_id = trim($data['product_id'] ?? '');
$discount = (int)($data['discount'] ?? 0);

if ($product_id === '') {
    echo json_encode(['status' => 'error', 'message' => 'product_id is required']);
    exit();
}

if ($discount < 0 || $discount > 99) {
    echo json_encode(['status' => 'error', 'message' => 'Знижка повинна бути від 0 до 99 відсотків']);
    exit();
}

$stmt = $conn->prepare("UPDATE products SET discount = ? WHERE id = ?");
$stmt->bind_param('is', $discount, $product_id);
$stmt->execute();

if ($stmt->affected_rows >= 0) {
    echo json_encode(['status' => 'success', 'message' => "Знижка $discount% встановлена для товару"]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Товар не знайдено']);
}

$stmt->close();
$conn->close();
?>
