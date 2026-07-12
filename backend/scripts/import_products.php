<?php
// URL файла YML
$url = "https://backend.mydrop.com.ua/vendor/api/export/products/prom/yml?public_api_key=7cbe3718003f120a0fa58cc327e6bdd508667edf&price_field=price&param_name=%D0%A0%D0%B0%D0%B7%D0%BC%D0%B5%D1%80&stock_sync=true&category_id=17670&platform=prom&file_format=yml&use_import_ids=false&with_hidden=false";

// Загружаем YML-файл
$xml = simplexml_load_file($url);

if (!$xml) {
    die("Ошибка загрузки YML");
}

// Подключаем базу данных
include('../config.php');
$mysqli = new mysqli(DB_HOSTNAME, DB_USERNAME, DB_PASSWORD, DB_DATABASE);

if ($mysqli->connect_error) {
    die("Ошибка подключения: " . $mysqli->connect_error);
}

// === ДОБАВЛЕНИЕ И ОБНОВЛЕНИЕ КАТЕГОРИЙ ===
foreach ($xml->shop->categories->category as $category) {
    $category_id = (string)$category['id'];
    $category_name = $mysqli->real_escape_string((string)$category);
    $parent_id = isset($category['parentId']) ? (string)$category['parentId'] : NULL;

    // Проверка, существует ли родительская категория
    if ($parent_id) {
        $checkParentQuery = "SELECT id FROM categories WHERE id = '$parent_id'";
        $parentResult = $mysqli->query($checkParentQuery);
        if ($parentResult->num_rows == 0) {
            // Вставка родительской категории, если её нет в базе
            $parent_category_name = ''; // Имя родительской категории оставим пустым, если не можем найти
            foreach ($xml->shop->categories->category as $parentCategory) {
                if ((string)$parentCategory['id'] == $parent_id) {
                    $parent_category_name = $mysqli->real_escape_string((string)$parentCategory);
                    break;
                }
            }
            $mysqli->query("INSERT INTO categories (id, name, parent_id) VALUES ('$parent_id', '$parent_category_name', NULL)");
        }
    }

    // Проверка, существует ли категория в базе
    $checkQuery = "SELECT id FROM categories WHERE id = '$category_id'";
    $result = $mysqli->query($checkQuery);

    if ($result->num_rows == 0) {
        // Вставка категории с родительским ID
        $mysqli->query("INSERT INTO categories (id, name, parent_id) VALUES ('$category_id', '$category_name', " . ($parent_id ? "'$parent_id'" : "NULL") . ")");
    }
}

// === ДОБАВЛЕНИЕ И ОБНОВЛЕНИЕ ТОВАРОВ ===
$totalProducts = 0;
$updatedProducts = 0; // Переменная для подсчета обновленных товаров

foreach ($xml->shop->offers->offer as $offer) {
    $product_id = (string)$offer['id'];
    $group_id = isset($offer['group_id']) ? (string)$offer['group_id'] : NULL;
    $category_id = (string)$offer->categoryId;
    $name = $mysqli->real_escape_string($offer->name);
    $description = $mysqli->real_escape_string($offer->description);
    $price = (float)$offer->price;
    $availability = ($offer['available'] == 'true') ? 1 : 0;
    $quantity_in_stock = isset($offer->quantity_in_stock) ? (int)$offer->quantity_in_stock : 0;
    $weight = isset($offer->weight) ? (float)$offer->weight : 0.0;

    // Ищем параметр "Размер"
    $size = '';
    foreach ($offer->param as $param) {
        if ((string)$param['name'] == 'Размер') {
            $size = $mysqli->real_escape_string((string)$param);
            break;
        }
    }

    // Проверка, существует ли товар в базе данных
    $checkQuery = "SELECT id, price, quantity_in_stock FROM products WHERE id = '$product_id'";
    $result = $mysqli->query($checkQuery);

    if ($result->num_rows == 0) {
        // Если товара нет в базе, добавляем его
        $mysqli->query("INSERT INTO products (id, group_id, category_id, name, description, price, size, availability, quantity_in_stock, weight) 
                        VALUES ('$product_id', " . ($group_id ? "'$group_id'" : "NULL") . ", '$category_id', '$name', '$description', $price, '$size', $availability, $quantity_in_stock, $weight)");
        $totalProducts++;
    } else {
        // Если товар есть в базе, проверяем обновления
        $existingProduct = $result->fetch_assoc();
        
        // Обновление товара, если цена или количество изменились
        if ($existingProduct['price'] != $price || $existingProduct['quantity_in_stock'] != $quantity_in_stock) {
            $mysqli->query("UPDATE products 
                            SET price = $price, quantity_in_stock = $quantity_in_stock, weight = $weight 
                            WHERE id = '$product_id'");
            $updatedProducts++; // Увеличиваем счетчик обновленных товаров
        }
    }

    // Вставка изображений
    if (isset($offer->picture)) {
        // Вставляем все картинки для товара
        foreach ($offer->picture as $image) {
            $imageUrl = $mysqli->real_escape_string((string)$image);
            $mysqli->query("INSERT INTO product_images (product_id, image) VALUES ('$product_id', '$imageUrl')");
        }
    }
}

$mysqli->close();

// Выводим статистику
echo "Общее количество товаров: " . count($xml->shop->offers->offer) . "<br>";
echo "Добавлено в базу: " . $totalProducts . "<br>";
echo "Обновлено товаров: " . $updatedProducts . "<br>";
echo "Категории и товары обновлены!";
?>
