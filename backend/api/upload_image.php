<?php
require_once __DIR__ . '/../includes/cors.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка завантаження файлу']);
    exit();
}

$fileTmpPath = $_FILES['image']['tmp_name'];
$fileName = $_FILES['image']['name'];
$fileSize = $_FILES['image']['size'];
$fileType = $_FILES['image']['type'];
$fileNameCmps = explode(".", $fileName);
$fileExtension = strtolower(end($fileNameCmps));

$allowedfileExtensions = array('jpg', 'gif', 'png', 'jpeg', 'webp');
if (!in_array($fileExtension, $allowedfileExtensions)) {
    echo json_encode(['status' => 'error', 'message' => 'Недозволений формат файлу. Дозволені лише JPG, JPEG, PNG, GIF, WEBP']);
    exit();
}

// 5MB limit
if ($fileSize > 5 * 1024 * 1024) {
    echo json_encode(['status' => 'error', 'message' => 'Файл занадто великий. Максимальний розмір: 5MB']);
    exit();
}

$uploadFileDir = dirname(__DIR__, 2) . '/uploads/';
if (!is_dir($uploadFileDir)) {
    mkdir($uploadFileDir, 0755, true);
}

$newFileName = md5(time() . $fileName) . '.' . $fileExtension;
$dest_path = $uploadFileDir . $newFileName;

if(move_uploaded_file($fileTmpPath, $dest_path)) {
    // Dynamically build root url for uploads directory
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
    $host = $_SERVER['HTTP_HOST'];
    // dirname($_SERVER['PHP_SELF']) returns /course__udemy/backend/api or similar
    $api_path = dirname($_SERVER['PHP_SELF']);
    $root_path = str_replace('/backend/api', '', $api_path);
    $root_path = rtrim($root_path, '/');
    
    $fileUrl = $protocol . '://' . $host . $root_path . '/uploads/' . $newFileName;
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Зображення успішно завантажено',
        'url' => $fileUrl
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Помилка збереження файлу на сервері']);
}
?>
