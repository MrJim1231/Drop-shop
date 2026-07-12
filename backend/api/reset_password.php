<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../api');
$dotenv->load();

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['token']) || !isset($data['new_password'])) {
    echo json_encode(["status" => "error", "message" => "Токен і новий пароль обов'язкові"]);
    exit();
}

$token = trim($data['token']);
$new_password = password_hash(trim($data['new_password']), PASSWORD_BCRYPT);

// Перевірка токена
$sql = "SELECT id, reset_expiry FROM users WHERE reset_token = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    error_log("Помилка підготовки запиту: " . $conn->error);
    echo json_encode(["status" => "error", "message" => "Помилка сервера"]);
    exit();
}

$stmt->bind_param("s", $token);
$stmt->execute();
$stmt->store_result();
$stmt->bind_result($user_id, $reset_expiry);
$stmt->fetch();

if ($stmt->num_rows == 0 || time() > $reset_expiry) {
    echo json_encode(["status" => "error", "message" => "Невірний або прострочений токен"]);
    exit();
}

// Оновлення пароля
$sql_update = "UPDATE users SET password = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?";
$stmt_update = $conn->prepare($sql_update);

if (!$stmt_update) {
    error_log("Помилка підготовки запиту на оновлення: " . $conn->error);
    echo json_encode(["status" => "error", "message" => "Помилка сервера"]);
    exit();
}

// Використовуємо 's' для рядкового типу даних id
$stmt_update->bind_param("ss", $new_password, $user_id);
$stmt_update->execute();

if ($stmt_update->affected_rows > 0) {
    echo json_encode(["status" => "success", "message" => "Пароль успішно змінено"]);
} else {
    echo json_encode(["status" => "error", "message" => "Помилка оновлення пароля"]);
}

$stmt->close();
$stmt_update->close();
$conn->close();
?>
