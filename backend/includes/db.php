<?php
// Подключаем конфиг с данными для подключения
require_once __DIR__ . '/../config.php'; // Подключаем конфиг

// Создаем подключение с использованием данных из конфига
$conn = new mysqli(DB_HOSTNAME, DB_USERNAME, DB_PASSWORD, DB_DATABASE);

// Проверка на ошибки подключения
if ($conn->connect_error) {
    die(json_encode(["error" => "Ошибка подключения: " . $conn->connect_error]));
}
?>
