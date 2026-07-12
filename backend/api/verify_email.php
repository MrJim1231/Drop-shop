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
use Firebase\JWT\JWT;

// Завантажуємо змінні середовища з файлу .env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../api'); // Вказуємо шлях до папки, де знаходиться .env
$dotenv->load();

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email']) || !isset($data['code'])) {
    echo json_encode(["status" => "error", "message" => "Email та код підтвердження обов'язкові"]);
    exit();
}

$email = trim($data['email']);
$code = intval($data['code']);

$sql = "SELECT id, verification_code FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();
$stmt->bind_result($user_id, $stored_code);
$stmt->fetch();

if ($stmt->num_rows == 0) {
    echo json_encode(["status" => "error", "message" => "Email не знайдено"]);
    exit();
}

if ($stored_code == $code) {
    // Оновлюємо статус користувача на підтверджений
    $sql_update = "UPDATE users SET is_verified = 1 WHERE email = ?";
    $stmt_update = $conn->prepare($sql_update);
    $stmt_update->bind_param("s", $email);
    $stmt_update->execute();

    // Генерація JWT токена
    $secret_key = $_ENV['JWT_SECRET_KEY']; // Ключ для підпису токена (повинен бути у файлі .env)

    if (!$secret_key) {
        echo json_encode(["status" => "error", "message" => "JWT_SECRET_KEY не задано у файлі .env"]);
        exit();
    }

    $issued_at = time();
    $expiration_time = $issued_at + 3600;  // Токен буде дійсним 1 годину
    $payload = [
        'iat' => $issued_at,  // Час створення
        'exp' => $expiration_time,  // Час закінчення
        'sub' => $user_id  // Ідентифікатор користувача
    ];

    try {
        $jwt = JWT::encode($payload, $secret_key, 'HS256'); // Додаємо алгоритм підпису 'HS256'
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Помилка при генерації токена: " . $e->getMessage()]);
        exit();
    }

    // Відправляємо успішну відповідь з токеном
    echo json_encode([
        "status" => "success",
        "message" => "Email успішно підтверджено",
        "token" => $jwt,
        "userId" => $user_id  // Повертаємо userId
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Невірний код"]);
}

$stmt->close();
$conn->close();
?>