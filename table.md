# Схема базы данных

База данных для интернет-магазина. Используется PHP-бэкендом и скриптом импорта `backend/scripts/import_products.php`.

---

## Как создать таблицы (рекомендуется)

**Не копируйте SQL из markdown-блоков** — phpMyAdmin не понимает строки ` ```sql ` и ` ``` `, из-за этого будет ошибка `#1064`.

### Способ 1 — импорт файла (проще всего)

1. Откройте phpMyAdmin
2. Создайте базу `online_shop_db` (или выберите уже созданную)
3. Вкладка **«Импорт»**
4. Выберите файл **`schema.sql`** из корня проекта
5. Нажмите **«Вперёд»**

Файл: `course__udemy/schema.sql`

### Способ 2 — вставить SQL вручную

1. Откройте файл **`schema.sql`**
2. Скопируйте **только SQL-код** (без ` ``` ` и без слова `sql`)
3. В phpMyAdmin выберите БД → вкладка **«SQL»** → вставьте → **«Вперёд»**

---

## Имя базы данных

Должно совпадать с `backend/config.php`:

```php
define('DB_DATABASE', 'online_shop_db');
```

Если БД называется иначе — измените имя в `schema.sql` и в `config.php`.

---

## Какие таблицы создаются

| Таблица          | Назначение                        |
|------------------|-----------------------------------|
| `categories`     | Категории и подкатегории          |
| `products`       | Товары (цена, размер, остаток)    |
| `product_images` | Фото товаров                      |
| `users`          | Регистрация и авторизация         |
| `orders`         | Заказы                            |
| `order_items`    | Товары в заказе                   |

> **categories.id** — назначаются автоматически при импорте из Excel.

---

## После создания таблиц

Импорт товаров из Excel `catalog_dropt_2026-07-12.xlsx`:

```
http://localhost/course__udemy/backend/scripts/import_products.php?reset=1
```

- `?reset=1` — очистить categories, products, product_images перед импортом
- без reset — обновить существующие товары

Запуск фронтенда:

```bash
cd frontend
npm run dev
```

Сайт: `http://localhost:5173`

---

## SQL-запросы (только для справки)

Полный рабочий SQL лежит в **`schema.sql`**.  
Ниже — то же самое, если нужно посмотреть структуру. **В phpMyAdmin копируйте из `schema.sql`, а не отсюда.**

CREATE TABLE categories (
  id        INT PRIMARY KEY,
  name      VARCHAR(255) NOT NULL,
  parent_id INT DEFAULT NULL,
  image     VARCHAR(512) DEFAULT NULL,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

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
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE product_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  image      VARCHAR(512) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id                VARCHAR(64) PRIMARY KEY,
  email             VARCHAR(100) NOT NULL UNIQUE,
  password          VARCHAR(255) NOT NULL,
  verification_code VARCHAR(6) NOT NULL DEFAULT '000000',
  is_verified       TINYINT(1) NOT NULL DEFAULT 0,
  reset_token       VARCHAR(64) DEFAULT NULL,
  reset_expiry      INT DEFAULT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
  FOREIGN KEY (product_id) REFERENCES products(id)
);
