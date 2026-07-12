Для запуска заходим в front cd , npm run dev

CREATE TABLE categories (
id INT PRIMARY KEY AUTO_INCREMENT,
name VARCHAR(255) NOT NULL,
parent_id INT DEFAULT NULL,
image VARCHAR(255) NULL,
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

---

CREATE TABLE products (
id VARCHAR(50) PRIMARY KEY,
group_id VARCHAR(255) NULL,
category_id INT,
name VARCHAR(255) NOT NULL,
description TEXT,
price DECIMAL(10,2) NOT NULL,
size VARCHAR(255),
availability BOOLEAN DEFAULT 1,
quantity_in_stock INT DEFAULT 0,
weight DECIMAL(10,2) DEFAULT NULL,
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

---

CREATE TABLE product_images (
id INT AUTO_INCREMENT PRIMARY KEY,
product_id VARCHAR(50),
image VARCHAR(255),
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

---

CREATE TABLE users (
id VARCHAR(36) PRIMARY KEY, -- 36 символов для UUID
email VARCHAR(100) NOT NULL,
password VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN verification_code INT NOT NULL;
ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0;

ALTER TABLE users ADD COLUMN reset_token VARCHAR(64) DEFAULT NULL;
ALTER TABLE users ADD COLUMN reset_expiry INT DEFAULT NULL;

---

CREATE TABLE orders (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255),
phone VARCHAR(50),
address TEXT,
comment TEXT,
total_price DECIMAL(10, 2),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
user_id VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL,
order_number VARCHAR(255) NOT NULL
);

CREATE TABLE order_items (
id INT AUTO_INCREMENT PRIMARY KEY,
order_id INT,
product_id VARCHAR(50),
name VARCHAR(255),
quantity INT,
price DECIMAL(10, 2),
image VARCHAR(255) NOT NULL,
size VARCHAR(50) NOT NULL,
rubber TINYINT(1) NOT NULL DEFAULT 0,
FOREIGN KEY (order_id) REFERENCES orders(id),
FOREIGN KEY (product_id) REFERENCES products(id)
);
