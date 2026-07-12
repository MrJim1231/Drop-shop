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

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Firebase\JWT\JWT;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../api');
$dotenv->load();

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email'])) {
    echo json_encode(["status" => "error", "message" => "Email обов'язковий"]);
    exit();
}

$email = trim($data['email']);

$sql_check = "SELECT id FROM users WHERE email = ?";
$stmt_check = $conn->prepare($sql_check);
if (!$stmt_check) {
    error_log("Помилка підготовки SELECT запиту: " . $conn->error);
    echo json_encode(["status" => "error", "message" => "Помилка сервера"]);
    exit();
}
$stmt_check->bind_param("s", $email);
$stmt_check->execute();
$stmt_check->store_result();

if ($stmt_check->num_rows == 0) {
    echo json_encode(["status" => "error", "message" => "Email не знайдений"]);
    exit();
}

$stmt_check->bind_result($user_id);
$stmt_check->fetch();
$stmt_check->close();

$reset_token = bin2hex(random_bytes(32));
$reset_expiry = time() + 3600;

$sql_update = "UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?";
$stmt_update = $conn->prepare($sql_update);
if (!$stmt_update) {
    error_log("Помилка підготовки UPDATE запиту: " . $conn->error);
    echo json_encode(["status" => "error", "message" => "Помилка сервера"]);
    exit();
}
$stmt_update->bind_param("sss", $reset_token, $reset_expiry, $user_id);
if (!$stmt_update->execute()) {
    error_log("Помилка виконання UPDATE запиту: " . $stmt_update->error);
    echo json_encode(["status" => "error", "message" => "Помилка сервера"]);
    exit();
}
$stmt_update->close();

$reset_link = $_ENV['BACKEND_URL'] . "/reset-password?token=$reset_token";

if (sendResetEmail($email, $reset_link)) {
    echo json_encode(["status" => "success", "message" => "Посилання для відновлення пароля надіслано на email"]);
} else {
    error_log("Помилка при відправці email на: " . $email);
    echo json_encode(["status" => "error", "message" => "Помилка при відправці листа"]);
}

function sendResetEmail($email, $reset_link)
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
        $mail->CharSet = 'UTF-8';
        $mail->Subject = "Відновлення пароля";
        $mail->Body = "<p>Для відновлення пароля перейдіть за посиланням:</p><p><a href='$reset_link'>$reset_link</a></p>";

        return $mail->send();
    } catch (Exception $e) {
        error_log("Помилка PHPMailer: " . $mail->ErrorInfo);
        return false;
    }
}

$conn->close();
?>
