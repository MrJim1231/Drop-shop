<?php
require __DIR__ . '/backend/includes/db.php';
$res = $conn->query("SELECT id, email, is_verified, is_admin FROM users");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        print_r($row);
    }
} else {
    echo "Error querying users: " . $conn->error;
}
$conn->close();
