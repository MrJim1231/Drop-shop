<?php
// Проверка, чтобы не переопределять константы, если они уже определены
if (!defined('DB_HOSTNAME')) {
    define('DB_HOSTNAME', 'localhost');
}

if (!defined('DB_USERNAME')) {
    define('DB_USERNAME', 'root');
}

if (!defined('DB_PASSWORD')) {
    define('DB_PASSWORD', 'mysql');
}

if (!defined('DB_DATABASE')) {
    define('DB_DATABASE', 'shop_db');
}
?>
