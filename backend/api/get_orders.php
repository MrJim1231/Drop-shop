<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Если это предварительный запрос OPTIONS, сразу завершаем обработку
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../includes/db.php'; // Подключение к базе данных

// Получаем userId из параметров запроса
$userId = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$userId) {
    echo json_encode(["status" => "error", "message" => "Пользователь не авторизован"]);
    exit();
}

// Получаем список заказов для текущего пользователя
$sql = "SELECT * FROM orders WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $orders = [];
    while ($order = $result->fetch_assoc()) {
        // Получаем товары для каждого заказа
        $order_id = $order['id'];
        $sql_items = "SELECT * FROM order_items WHERE order_id = $order_id";
        $items_result = $conn->query($sql_items);

        $items = [];
        while ($item = $items_result->fetch_assoc()) {
            $items[] = $item;
        }

        $order['items'] = $items;
        $orders[] = $order;
    }

    echo json_encode($orders);
} else {
    echo json_encode(["status" => "error", "message" => "Нет заказов для этого пользователя"]);
}

$conn->close();
?>
