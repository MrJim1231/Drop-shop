<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$userId = isset($data['userId']) ? trim($data['userId']) : null;
$name = isset($data['name']) ? trim($data['name']) : null;
$phone = isset($data['phone']) ? trim($data['phone']) : null;
$address = isset($data['address']) ? trim($data['address']) : null;

if (!$userId) {
    echo json_encode(["status" => "error", "message" => "Користувач не авторизований"]);
    exit();
}

$sql = "UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssss", $name, $phone, $address, $userId);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Профіль успішно оновлено"]);
} else {
    echo json_encode(["status" => "error", "message" => "Не вдалося оновити профіль"]);
}

$stmt->close();
$conn->close();
?>
