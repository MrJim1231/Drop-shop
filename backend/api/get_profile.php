<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/db.php';

$userId = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$userId) {
    echo json_encode(["status" => "error", "message" => "Користувач не авторизований"]);
    exit();
}

$sql = "SELECT email, name, phone, address, is_admin FROM users WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    echo json_encode(["status" => "success", "data" => $user]);
} else {
    echo json_encode(["status" => "error", "message" => "Користувача не знайдено"]);
}

$conn->close();
?>
