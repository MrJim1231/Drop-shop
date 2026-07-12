<?php
require_once __DIR__ . '/../includes/cors.php';

$data = json_decode(file_get_contents("php://input"), true);
$fileName = isset($data['fileName']) ? trim($data['fileName']) : null;

if (!$fileName) {
    echo json_encode(["status" => "error", "message" => "Ім'я файлу не вказано"]);
    exit();
}

$fileName = basename($fileName);
$fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

if ($fileExtension !== 'xlsx') {
    echo json_encode(["status" => "error", "message" => "Дозволено видаляти лише .xlsx файли"]);
    exit();
}

$filePath = dirname(__DIR__, 2) . '/' . $fileName;

if (file_exists($filePath)) {
    if (unlink($filePath)) {
        echo json_encode(["status" => "success", "message" => "Каталог '$fileName' успішно видалено"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Не вдалося видалити файл"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Файл не знайдено"]);
}
?>
