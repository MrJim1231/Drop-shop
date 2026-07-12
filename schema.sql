-- Схема БД для интернет-магазина
-- Импорт: phpMyAdmin -> выбрать БД -> вкладка "Импорт" -> выбрать этот файл
-- Или: создайте БД вручную, выберите её, затем импортируйте

CREATE DATABASE IF NOT EXISTS online_shop_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE online_shop_db;

-- 1. Категории (ID приходят из MyDrop/YML, без AUTO_INCREMENT)
CREATE TABLE categories (
  id        INT PRIMARY KEY,
  name      VARCHAR(255) NOT NULL,
  parent_id INT DEFAULT NULL,
  image     VARCHAR(512) DEFAULT NULL,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Товары
CREATE TABLE products (
  id                VARCHAR(50) PRIMARY KEY,
  group_id          VARCHAR(255) DEFAULT NULL,
  category_id       INT DEFAULT NULL,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  price             DECIMAL(10, 2) NOT NULL,
  size              VARCHAR(255) DEFAULT NULL,
  availability      TINYINT(1) DEFAULT 1,
  quantity_in_stock INT DEFAULT 0,
  weight            DECIMAL(10, 2) DEFAULT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_products_category (category_id),
  INDEX idx_products_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Изображения товаров
CREATE TABLE product_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  image      VARCHAR(512) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_images_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Пользователи
CREATE TABLE users (
  id                VARCHAR(64) PRIMARY KEY,
  email             VARCHAR(100) NOT NULL UNIQUE,
  password          VARCHAR(255) NOT NULL,
  verification_code VARCHAR(6) NOT NULL DEFAULT '000000',
  is_verified       TINYINT(1) NOT NULL DEFAULT 0,
  reset_token       VARCHAR(64) DEFAULT NULL,
  reset_expiry      INT DEFAULT NULL,
  name              VARCHAR(255) DEFAULT NULL,
  phone             VARCHAR(50) DEFAULT NULL,
  address           TEXT DEFAULT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 5. Заказы
CREATE TABLE orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(255) NOT NULL,
  name         VARCHAR(255) NOT NULL,
  phone        VARCHAR(50) NOT NULL,
  address      TEXT NOT NULL,
  email        VARCHAR(255) NOT NULL,
  comment      TEXT,
  total_price  DECIMAL(10, 2) NOT NULL,
  user_id      VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_number (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Позиции заказа
CREATE TABLE order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  name       VARCHAR(255) NOT NULL,
  quantity   INT NOT NULL,
  price      DECIMAL(10, 2) NOT NULL,
  image      VARCHAR(512) NOT NULL DEFAULT '',
  size       VARCHAR(50) NOT NULL DEFAULT '-',
  rubber     TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
