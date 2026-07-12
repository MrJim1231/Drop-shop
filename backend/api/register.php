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
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Завантажуємо змінні середовища з файлу .env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../api'); // Вказуємо шлях до папки, де знаходиться .env
$dotenv->load();

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email']) || !isset($data['password'])) {
    echo json_encode(["status" => "error", "message" => "Email та пароль обов'язкові"]);
    exit();
}

$email = trim($data['email']);
$password = trim($data['password']);

// Перевіряємо, чи передано userId, якщо ні - генеруємо новий
$user_id = isset($data['userId']) ? $data['userId'] : uniqid();

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Некоректний email"]);
    exit();
}

if (strlen($password) < 6) {
    echo json_encode(["status" => "error", "message" => "Пароль має бути не менше 6 символів"]);
    exit();
}

// Перевірка на існуючий email
$sql_check = "SELECT id, is_verified FROM users WHERE email = ?";
$stmt_check = $conn->prepare($sql_check);
$stmt_check->bind_param("s", $email);
$stmt_check->execute();
$stmt_check->store_result();
$stmt_check->bind_result($existing_id, $is_verified);
$stmt_check->fetch();

if ($stmt_check->num_rows > 0) {
    if ($is_verified) {
        echo json_encode(["status" => "error", "message" => "Email вже зареєстрований та підтверджений"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Email вже зареєстрований, але не підтверджений. Перевірте пошту"]);
    }
    exit();
}

// Хешуємо пароль
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Генеруємо код підтвердження (6 цифр)
$verification_code = (string) random_int(100000, 999999);

// Вставляємо нового користувача в базу
$sql = "INSERT INTO users (id, email, password, verification_code, is_verified) VALUES (?, ?, ?, ?, 0)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssss", $user_id, $email, $hashed_password, $verification_code);

try {
    if ($stmt->execute()) {
        // Відправляємо код на пошту
        if (sendVerificationEmail($email, $verification_code)) {
            echo json_encode([
                "status" => "success",
                "message" => "Реєстрація пройшла успішно. Перевірте пошту для підтвердження",
                "userId" => $user_id
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Помилка при відправці листа з кодом підтвердження"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Помилка при реєстрації"]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Помилка при реєстрації: " . $e->getMessage()]);
}

$stmt->close();
$conn->close();

// Функція відправки листа
function sendVerificationEmail($email, $verification_code)
{
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = $_ENV['MAIL_HOST'];
        $mail->SMTPAuth = true;
        $mail->Username = $_ENV['MAIL_USERNAME'];
        $mail->Password = $_ENV['MAIL_PASSWORD'];
        $mail->SMTPSecure = $_ENV['MAIL_ENCRYPTION'];
        $mail->Port = $_ENV['MAIL_PORT'];

        $mail->setFrom($_ENV['ADMIN_EMAIL'], 'Інтернет магазин постільної білизни Sleep & Dream');
        $mail->addAddress($email);

        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';  // Встановлюємо правильну кодування
        $mail->Subject = "Код підтвердження реєстрації";
        $mail->Body = "Ваш код підтвердження: <b>$verification_code</b>";

        // Переконайтесь, що тіло листа в кодуванні UTF-8
        $mail->Body = mb_convert_encoding($mail->Body, 'UTF-8', 'auto');

        return $mail->send();
    } catch (Exception $e) {
        return false;
    }
}

?>
