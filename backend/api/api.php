<?php
// Разрешаем доступ с любого источника
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Проверяем preflight-запрос (OPTIONS) и завершаем выполнение, если он есть
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Подключаем файл с продуктами
// require_once __DIR__ . '/products.php';
?>
