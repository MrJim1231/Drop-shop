<?php
require_once __DIR__ . '/../includes/cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Недозволений метод"]);
    exit();
}

if (!isset($_FILES['catalog']) || $_FILES['catalog']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["status" => "error", "message" => "Помилка завантаження файлу"]);
    exit();
}

$fileTmpPath = $_FILES['catalog']['tmp_name'];
$fileName = $_FILES['catalog']['name'];
$fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

if ($fileExtension !== 'xlsx') {
    echo json_encode(["status" => "error", "message" => "Будь ласка, завантажте файл у форматі .xlsx"]);
    exit();
}

// Санітизуємо ім'я файлу для безпеки
$safeFileName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $fileName);
$destPath = dirname(__DIR__, 2) . '/' . $safeFileName;

if (move_uploaded_file($fileTmpPath, $destPath)) {
    echo json_encode(["status" => "success", "message" => "Каталог '$safeFileName' успішно завантажено"]);
} else {
    echo json_encode(["status" => "error", "message" => "Не вдалося зберегти файл на сервері"]);
}
?>
