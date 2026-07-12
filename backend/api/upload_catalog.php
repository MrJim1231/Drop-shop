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

$destPath = dirname(__DIR__, 2) . '/catalog_dropt_2026-07-12.xlsx';

if (move_uploaded_file($fileTmpPath, $destPath)) {
    echo json_encode(["status" => "success", "message" => "Каталог успішно завантажено"]);
} else {
    echo json_encode(["status" => "error", "message" => "Не вдалося зберегти файл на сервері"]);
}
?>
