<?php
require_once __DIR__ . '/../includes/cors.php';
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/category_helpers.php';

$sql = "SELECT id, name, image FROM categories WHERE parent_id IS NULL ORDER BY name";
$result = $conn->query($sql);

$categories = [];
while ($row = $result->fetch_assoc()) {
    $category = $row;
    $category_id = (int) $row['id'];

    // Fetch direct subcategories
    $sub_sql = "SELECT id, name FROM categories WHERE parent_id = ? ORDER BY name";
    $sub_stmt = $conn->prepare($sub_sql);
    $sub_stmt->bind_param('i', $category_id);
    $sub_stmt->execute();
    $sub_res = $sub_stmt->get_result();

    $subcategories = [];
    while ($sub_row = $sub_res->fetch_assoc()) {
        $subcategories[] = [
            'id' => $sub_row['id'],
            'name' => $sub_row['name']
        ];
    }
    $sub_stmt->close();
    $category['subcategories'] = $subcategories;

    if (empty($category['image'])) {
        $descendantIds = getDescendantCategoryIds($conn, $category_id);
        $idsList = implode(',', array_map('intval', $descendantIds));

        $sql_product = "
            SELECT pi.image
            FROM product_images pi
            JOIN products p ON pi.product_id = p.id
            WHERE p.category_id IN ($idsList)
            LIMIT 1
        ";
        $product_result = $conn->query($sql_product);
        $product = $product_result ? $product_result->fetch_assoc() : null;

        $category['image'] = ($product && !empty($product['image']))
            ? $product['image']
            : 'https://placehold.co/400x300/f1f5f9/94a3b8?text=' . rawurlencode($row['name']);
    }

    $categories[] = $category;
}

echo json_encode($categories, JSON_UNESCAPED_UNICODE);
?>
