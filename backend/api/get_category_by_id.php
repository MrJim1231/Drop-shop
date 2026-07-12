<?php
require_once __DIR__ . '/../includes/cors.php';
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/category_helpers.php';

$category_id = isset($_GET['category_id']) ? (int) $_GET['category_id'] : 0;

if (!$category_id) {
    echo json_encode(['error' => 'Не указан ID категории'], JSON_UNESCAPED_UNICODE);
    exit();
}

$stmt = $conn->prepare('SELECT id, name, parent_id, image FROM categories WHERE id = ?');
$stmt->bind_param('i', $category_id);
$stmt->execute();
$category = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$category) {
    echo json_encode(['error' => 'Категория не найдена'], JSON_UNESCAPED_UNICODE);
    exit();
}

if ($category['parent_id']) {
    $parent_stmt = $conn->prepare('SELECT id, name FROM categories WHERE id = ?');
    $parent_id = (int) $category['parent_id'];
    $parent_stmt->bind_param('i', $parent_id);
    $parent_stmt->execute();
    $category['parent_category'] = $parent_stmt->get_result()->fetch_assoc();
    $parent_stmt->close();
} else {
    $category['parent_category'] = null;
}

$sub_stmt = $conn->prepare('SELECT id, name, image FROM categories WHERE parent_id = ? ORDER BY name');
$sub_stmt->bind_param('i', $category_id);
$sub_stmt->execute();
$sub_result = $sub_stmt->get_result();

$subcategories = [];
while ($row = $sub_result->fetch_assoc()) {
    if (empty($row['image'])) {
        $childId = (int) $row['id'];
        $descendantIds = getDescendantCategoryIds($conn, $childId);
        $idsList = implode(',', array_map('intval', $descendantIds));
        $imageQuery = "
            SELECT pi.image
            FROM product_images pi
            JOIN products p ON pi.product_id = p.id
            WHERE p.category_id IN ($idsList)
            LIMIT 1
        ";
        $imageResult = $conn->query($imageQuery);
        $imageRow = $imageResult ? $imageResult->fetch_assoc() : null;
        $row['image'] = $imageRow['image'] ?? (
            'https://placehold.co/400x300/f1f5f9/94a3b8?text=' . rawurlencode($row['name'])
        );
    }
    $subcategories[] = $row;
}
$sub_stmt->close();

$category['subcategories'] = $subcategories;

echo json_encode($category, JSON_UNESCAPED_UNICODE);
