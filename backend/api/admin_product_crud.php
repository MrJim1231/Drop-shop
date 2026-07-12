<?php
require_once __DIR__ . '/../includes/cors.php';
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../includes/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$action = trim($data['action'] ?? '');

if ($action === 'create') {
    $id = trim($data['id'] ?? '');
    $category_id = isset($data['category_id']) && $data['category_id'] !== '' ? (int)$data['category_id'] : null;
    $name = trim($data['name'] ?? '');
    $description = isset($data['description']) ? trim($data['description']) : null;
    $price = (float)($data['price'] ?? 0.0);
    $availability = isset($data['availability']) ? (int)$data['availability'] : 1;
    $size = isset($data['size']) ? trim($data['size']) : null;
    $quantity_in_stock = isset($data['quantity_in_stock']) ? (int)$data['quantity_in_stock'] : 0;
    $weight = isset($data['weight']) && $data['weight'] !== '' ? (float)$data['weight'] : null;
    $supplier = isset($data['supplier']) ? trim($data['supplier']) : null;
    $image = isset($data['image']) ? trim($data['image']) : null;

    if ($id === '' || $name === '' || $price <= 0 || !$category_id) {
        echo json_encode(['status' => 'error', 'message' => 'Необхідно вказати ID (SKU), Назву, Категорію та Ціну (більше 0)']);
        exit();
    }

    // Check if ID already exists
    $stmt_check = $conn->prepare("SELECT id FROM products WHERE id = ?");
    $stmt_check->bind_param('s', $id);
    $stmt_check->execute();
    $stmt_check->store_result();
    if ($stmt_check->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Товар з таким ID (SKU) вже існує']);
        $stmt_check->close();
        exit();
    }
    $stmt_check->close();

    // Insert product
    $stmt = $conn->prepare("INSERT INTO products (id, category_id, name, description, price, availability, size, quantity_in_stock, weight, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('sissdiisds', $id, $category_id, $name, $description, $price, $availability, $size, $quantity_in_stock, $weight, $supplier);
    
    if ($stmt->execute()) {
        // If image is supplied, insert main image
        if ($image !== null && trim($image) !== '') {
            $stmt_img = $conn->prepare("INSERT INTO product_images (product_id, image) VALUES (?, ?)");
            $stmt_img->bind_param('ss', $id, $image);
            $stmt_img->execute();
            $stmt_img->close();
        }
        echo json_encode(['status' => 'success', 'message' => 'Товар успішно створено']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Помилка бази даних: ' . $stmt->error]);
    }
    $stmt->close();

} elseif ($action === 'update') {
    $id = trim($data['id'] ?? '');
    $category_id = isset($data['category_id']) && $data['category_id'] !== '' ? (int)$data['category_id'] : null;
    $name = trim($data['name'] ?? '');
    $description = isset($data['description']) ? trim($data['description']) : null;
    $price = (float)($data['price'] ?? 0.0);
    $availability = isset($data['availability']) ? (int)$data['availability'] : 1;
    $size = isset($data['size']) ? trim($data['size']) : null;
    $quantity_in_stock = isset($data['quantity_in_stock']) ? (int)$data['quantity_in_stock'] : 0;
    $weight = isset($data['weight']) && $data['weight'] !== '' ? (float)$data['weight'] : null;
    $supplier = isset($data['supplier']) ? trim($data['supplier']) : null;
    $image = isset($data['image']) ? trim($data['image']) : null;

    if ($id === '' || $name === '' || $price <= 0 || !$category_id) {
        echo json_encode(['status' => 'error', 'message' => 'Необхідно вказати ID (SKU), Назву, Категорію та Ціну (більше 0)']);
        exit();
    }

    // Update product
    $stmt = $conn->prepare("UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, availability = ?, size = ?, quantity_in_stock = ?, weight = ?, supplier = ? WHERE id = ?");
    $stmt->bind_param('issdiisdss', $category_id, $name, $description, $price, $availability, $size, $quantity_in_stock, $weight, $supplier, $id);
    
    if ($stmt->execute()) {
        // Handle main image update
        if ($image !== null && trim($image) !== '') {
            // Check if product has an image
            $res_img = $conn->query("SELECT id FROM product_images WHERE product_id = '" . $conn->real_escape_string($id) . "' LIMIT 1");
            $row_img = $res_img->fetch_assoc();
            
            if ($row_img) {
                // Update existing main image
                $stmt_img = $conn->prepare("UPDATE product_images SET image = ? WHERE id = ?");
                $img_id = (int)$row_img['id'];
                $stmt_img->bind_param('si', $image, $img_id);
                $stmt_img->execute();
                $stmt_img->close();
            } else {
                // Insert new image
                $stmt_img = $conn->prepare("INSERT INTO product_images (product_id, image) VALUES (?, ?)");
                $stmt_img->bind_param('ss', $id, $image);
                $stmt_img->execute();
                $stmt_img->close();
            }
        }
        echo json_encode(['status' => 'success', 'message' => 'Товар успішно оновлено']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Помилка бази даних: ' . $stmt->error]);
    }
    $stmt->close();

} elseif ($action === 'delete') {
    $id = trim($data['id'] ?? '');

    if ($id === '') {
        echo json_encode(['status' => 'error', 'message' => 'Некоректний ID (SKU) товару']);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param('s', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Товар успішно видалено']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Помилка бази даних: ' . $stmt->error]);
    }
    $stmt->close();

} else {
    echo json_encode(['status' => 'error', 'message' => 'Невідома дія']);
}

$conn->close();
?>
