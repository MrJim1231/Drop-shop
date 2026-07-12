<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';

$stats = [];

// Total products
$totalProductsRes = $conn->query("SELECT COUNT(*) AS count FROM products");
$stats['total_products'] = (int)($totalProductsRes->fetch_assoc()['count'] ?? 0);

// Total categories
$totalCategoriesRes = $conn->query("SELECT COUNT(*) AS count FROM categories");
$stats['total_categories'] = (int)($totalCategoriesRes->fetch_assoc()['count'] ?? 0);

// Suppliers stats
$suppliersRes = $conn->query("SELECT COALESCE(supplier, 'Інші / Невідомо') AS supplier_name, COUNT(*) AS count FROM products GROUP BY supplier");
$stats['suppliers'] = [];
while ($row = $suppliersRes->fetch_assoc()) {
    $stats['suppliers'][] = [
        "name" => $row['supplier_name'],
        "count" => (int)$row['count']
    ];
}

echo json_encode(["status" => "success", "data" => $stats]);

$conn->close();
?>
