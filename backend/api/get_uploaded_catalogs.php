<?php
require_once __DIR__ . '/../includes/cors.php';

$rootDir = dirname(__DIR__, 2);
$files = glob($rootDir . '/*.xlsx');

$result = [];

foreach ($files as $file) {
    $name = basename($file);
    $sizeBytes = filesize($file);
    $sizeFormatted = round($sizeBytes / (1024 * 1024), 2) . ' MB';
    $mtime = filemtime($file);
    $uploadedAt = date('Y-m-d H:i:s', $mtime);

    $result[] = [
        "name" => $name,
        "size" => $sizeFormatted,
        "uploaded_at" => $uploadedAt
    ];
}

// Сортуємо: новіші файли спочатку
usort($result, function ($a, $b) {
    return strcmp($b['uploaded_at'], $a['uploaded_at']);
});

echo json_encode($result);
?>
