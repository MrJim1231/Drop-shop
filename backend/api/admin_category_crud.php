<?php
require_once __DIR__ . '/../includes/cors.php';
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../includes/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Read all categories flat list
    $sql = "SELECT id, name, parent_id, image FROM categories ORDER BY name";
    $result = $conn->query($sql);
    
    $categories = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $categories[] = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'parent_id' => $row['parent_id'] !== null ? (int)$row['parent_id'] : null,
                'image' => $row['image']
            ];
        }
    }
    
    echo json_encode(['status' => 'success', 'categories' => $categories], JSON_UNESCAPED_UNICODE);
    $conn->close();
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = trim($data['action'] ?? '');
    
    if ($action === 'create') {
        $name = trim($data['name'] ?? '');
        $parent_id = isset($data['parent_id']) && $data['parent_id'] !== '' ? (int)$data['parent_id'] : null;
        $image = isset($data['image']) && trim($data['image']) !== '' ? trim($data['image']) : null;
        
        if ($name === '') {
            echo json_encode(['status' => 'error', 'message' => 'Назва категорії обовʼязкова']);
            exit();
        }
        
        // Find next category ID (above 1000000)
        $res = $conn->query("SELECT MAX(id) AS max_id FROM categories");
        $row = $res->fetch_assoc();
        $next_id = max(1000000, (int)($row['max_id'] ?? 1000000)) + 1;
        
        $stmt = $conn->prepare("INSERT INTO categories (id, name, parent_id, image) VALUES (?, ?, ?, ?)");
        $stmt->bind_param('isis', $next_id, $name, $parent_id, $image);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Категорію успішно створено', 'id' => $next_id]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Помилка бази даних: ' . $stmt->error]);
        }
        $stmt->close();
        
    } elseif ($action === 'update') {
        $id = (int)($data['id'] ?? 0);
        $name = trim($data['name'] ?? '');
        $parent_id = isset($data['parent_id']) && $data['parent_id'] !== '' ? (int)$data['parent_id'] : null;
        $image = isset($data['image']) && trim($data['image']) !== '' ? trim($data['image']) : null;
        
        if ($id <= 0 || $name === '') {
            echo json_encode(['status' => 'error', 'message' => 'Некоректні дані категорії']);
            exit();
        }
        
        // Prevent setting a category as its own parent
        if ($id === $parent_id) {
            echo json_encode(['status' => 'error', 'message' => 'Категорія не може бути батьківською сама для себе']);
            exit();
        }
        
        $stmt = $conn->prepare("UPDATE categories SET name = ?, parent_id = ?, image = ? WHERE id = ?");
        $stmt->bind_param('sisi', $name, $parent_id, $image, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Категорію успішно оновлено']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Помилка бази даних: ' . $stmt->error]);
        }
        $stmt->close();
        
    } elseif ($action === 'delete') {
        $id = (int)($data['id'] ?? 0);
        
        if ($id <= 0) {
            echo json_encode(['status' => 'error', 'message' => 'Некоректний ID категорії']);
            exit();
        }
        
        $stmt = $conn->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->bind_param('i', $id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Категорію успішно видалено']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Помилка бази даних: ' . $stmt->error]);
        }
        $stmt->close();
        
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Невідома дія']);
    }
    
    $conn->close();
    exit();
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
?>
