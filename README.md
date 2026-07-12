# 🛒 DropShop — Інтернет-магазин (Дропшипінг)

Повноцінний інтернет-магазин із розділенням на **Frontend** (Vanilla JS + Vite + Tailwind CSS) та **Backend** (чистий PHP + MySQL). Підтримує імпорт товарів з Excel-каталогів постачальника (Dropt), управління замовленнями, реєстрацію та авторизацію користувачів, адмін-панель із гнучким керуванням знижками, інтегровану преміальну темну тему та автоматизований набір тестів.

---

## 📂 Структура проекту

```
course__udemy/
├── backend/                        # Серверна частина (PHP)
│   ├── api/                        # REST API ендпоінти (JSON)
│   │   ├── .env                    # Конфіг: JWT, SMTP, CORS
│   │   ├── api.php                 # Єдина точка входу (роутер)
│   │   ├── categories.php          # GET дерево категорій
│   │   ├── get_category_by_id.php  # GET категорія + підкатегорії
│   │   ├── get_products_by_category.php  # GET товари за категорією
│   │   ├── get_discounted_products.php  # GET товари зі знижкою
│   │   ├── products.php            # GET список / пошук товарів
│   │   ├── product-details.php     # GET деталі товару
│   │   ├── order.php               # POST створення замовлення
│   │   ├── get_orders.php          # GET замовлення користувача
│   │   ├── login.php               # POST авторизація (JWT)
│   │   ├── register.php            # POST реєстрація + верифікація email
│   │   ├── verify_email.php        # GET підтвердження email
│   │   ├── reset_password_request.php  # POST запит скидання паролю
│   │   ├── reset_password.php      # POST скидання паролю
│   │   ├── logout.php              # POST вихід
│   │   ├── get_profile.php         # GET профіль користувача
│   │   ├── update_profile.php      # PUT оновлення профілю
│   │   ├── get_stats.php           # GET статистика (адмін)
│   │   ├── upload_catalog.php      # POST завантаження Excel-каталогу
│   │   ├── get_uploaded_catalogs.php # GET список завантажених каталогів
│   │   └── delete_catalog.php      # DELETE каталог
│   ├── includes/
│   │   └── category_helpers.php    # Допоміжні функції: дерево категорій,
│   │                               # маппінг підкатегорій на кореневі
│   ├── scripts/
│   │   ├── import_products.php     # Імпорт товарів з Excel (.xlsx)
│   │   ├── import_xml.php          # Імпорт товарів з YML/XML (Dropt API)
│   │   └── SimpleXlsxReader.php    # Мінімальний парсер XLSX
│   ├── config.php                  # Константи підключення до БД
│   └── composer.json               # PHP-залежності
│
├── frontend/                       # Клієнтська частина (Vanilla JS SPA)
│   ├── src/
│   │   ├── api/
│   │   │   ├── config.js           # API_URL
│   │   │   └── client.js           # Axios-клієнт з перехоплювачем токена
│   │   ├── components/
│   │   │   ├── header.js           # Шапка: навігація, пошук, кошик, темна тема
│   │   │   └── footer.js           # Підвал
│   │   ├── pages/
│   │   │   ├── home.js             # Головна сторінка (банер, акції, категорії)
│   │   │   ├── categories.js       # Сторінка всіх категорій
│   │   │   ├── categoryProducts.js # Товари категорії з фільтрами
│   │   │   ├── productDetail.js    # Деталі товару + галерея
│   │   │   ├── cart.js             # Кошик + оформлення замовлення
│   │   │   ├── orders.js           # Мої замовлення
│   │   │   ├── login.js            # Авторизація / Реєстрація
│   │   │   ├── profile.js          # Профіль користувача
│   │   │   ├── search.js           # Сторінка пошуку
│   │   │   ├── deals.js            # Сторінка акційних товарів зі знижкою
│   │   │   └── admin.js            # Адмін-панель (імпорт, статистика, знижки)
│   │   ├── store/
│   │   │   ├── auth.js             # Стан авторизації (localStorage)
│   │   │   └── cart.js             # Стан кошика (localStorage)
│   │   ├── __tests__/              # Автоматизовані тести (Vitest)
│   │   │   ├── auth.test.js        # Тести authStore
│   │   │   ├── cart.test.js        # Тести cartStore
│   │   │   └── utils.test.js       # Тести утиліт
│   │   ├── router.js               # SPA-роутер (History API)
│   │   ├── utils.js                # Загальні утиліти
│   │   ├── style.css               # Стилі (Tailwind CSS v4 + кастомні стилі)
│   │   └── main.js                 # Точка входу
│   ├── vite.config.js              # Конфігурація Vite та Vitest
│   ├── package.json                # Залежності та тестові скрипти
│   └── index.html
│
├── schema.sql                      # SQL-схема бази даних
├── catalog_dropt_*.xlsx            # Excel-каталог постачальника
└── README.md
```

---

## 🛠️ Технологічний стек

### Frontend
| Технологія | Версія | Призначення |
|---|---|---|
| Vanilla JavaScript | ES2022+ | SPA без фреймворків |
| Vite | 8.x | Збірник / dev-сервер |
| Tailwind CSS | 4.x | Стилізація (нова система та кастомний селектор темної теми) |
| History API | — | Клієнтська маршрутизація |
| Axios | — | HTTP-запити до API |
| Vitest | 4.x | Швидкий фреймворк для юніт-тестування |
| JSDOM | — | Емуляція DOM-оточення в Node.js для тестів |

### Backend
| Технологія | Призначення |
|---|---|
| PHP 8.1+ (Vanilla) | REST API |
| MySQL 8 | База даних |
| `firebase/php-jwt` | JWT-авторизація |
| PHPMailer | Відправка email (верифікація, скидання паролю) |
| `vlucas/phpdotenv` | Читання `.env` файлу |
| Apache (AMPPS/XAMPP) | Веб-сервер для PHP |

---

## ✨ Нові можливості та покращення

### 1. Преміальна темна тема (Dark Mode)
- **Зміна теми в один клік:** Кнопка-перемикач інтегрована в шапку сайту. Стан зберігається в `localStorage` під ключем `theme`.
- **Селекторний режим:** У Tailwind CSS v4 налаштовано кастомний варіант `@custom-variant dark (&:where(.dark, .dark *))`. Це гарантує, що темний режим сайту активується виключно за наявності класу `.dark` на тегу `<html>` і не залежить від глобальних налаштувань ОС користувача.
- **Естетичні оверрайти:** Повністю оновлено вигляд карток товарів, категорій, полів введення, таблиць адмін-панелі та смуг прокрутки (scrollbar) під темні відтінки (Slate-900 / Zinc-950).

### 2. Керування знижками та сторінка акцій
- **Розділ «Акції»:** На головному слайдері активовано посилання «Переглянути акції», що перенаправляє на сторінку `/deals`.
- **Сторінка акційних товарів:** Сторінка `/deals` підвантажує товари через новий ендпоінт `api/get_discounted_products.php` і динамічно виводить товари з розрахованою старою/новою ціною та яскравим бейджем відсотка знижки.
- **Адміністрування:** В адмін-панелі виведено список товарів із можливістю редагувати відсоток знижки. Вже продисконтовані товари мають чітку позначку знижки поруч із базовою ціною.

### 3. Покращений інтерфейс карток (Premium Card UI)
- **Inner Frame Design:** Зображення у картках товарів та категорій тепер розміщені всередині окремої білої підкладки із заокругленими кутами (`rounded-xl border`). Це вирішує проблему неохайних білих фонів у JPG-картинках постачальника на темному фоні.
- **Масштабування картинок:** Використано клас `object-contain p-2` замість обрізання картинки, що зберігає початкові пропорції товарів.

### 4. Стабільна маршрутизація
- Виправлено конфлікт асинхронної навігації (race condition) при оформленні замовлення в кошику. Очищення кошика тепер відкладається через `setTimeout` після ініціації переходу `navigateTo('/orders')`.

---

## 🗃️ Схема бази даних

| Таблиця | Опис |
|---|---|
| `categories` | Дерево категорій (id, name, parent_id, image) |
| `products` | Товари (id, category_id, name, description, price, discount, discounted_price, availability, …) |
| `product_images` | Зображення товарів (product_id, image URL) |
| `users` | Користувачі (email, password hash, верифікація, JWT) |
| `orders` | Замовлення (order_number, name, phone, address, total_price) |
| `order_items` | Позиції замовлень (order_id, product_id, quantity, price) |

> Повна схема: [`schema.sql`](schema.sql)

---

## 🚀 Запуск проекту

### Передумови
- **AMPPS / XAMPP / OpenServer** — Apache + PHP 8.1+ + MySQL
- **Node.js** 18+ та **npm**
- **Composer** (менеджер PHP-пакетів)

---

### 1. Клонування та розміщення

Розмістіть папку проекту `course__udemy` у кореневій директорії вашого веб-сервера:
- AMPPS: `C:\Program Files\Ampps\www\course__udemy\`
- XAMPP: `C:\xampp\htdocs\course__udemy\`

---

### 2. База даних

1. Відкрийте **phpMyAdmin** → Створіть нову БД `online_shop_db` (кодування: `utf8mb4_unicode_ci`)
2. Імпортуйте схему: вкладка **«Імпорт»** → виберіть файл [`schema.sql`](schema.sql)

---

### 3. Налаштування Backend

#### 3.1 Підключення до БД

Відкрийте [`backend/config.php`](backend/config.php) та вкажіть параметри:

```php
define('DB_HOSTNAME', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', 'ваш_пароль_mysql');  // за замовчуванням: 'mysql' в AMPPS
define('DB_DATABASE', 'online_shop_db');
```

#### 3.2 Змінні середовища (.env)

Відкрийте [`backend/api/.env`](backend/api/.env) та заповніть:

```env
# JWT
JWT_SECRET_KEY="ваш_секретний_ключ_32_символи"

# SMTP (для підтвердження email та скидання паролю)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_ENCRYPTION="STARTTLS"
MAIL_USERNAME="ваша_пошта@gmail.com"
MAIL_PASSWORD="пароль_додатку_google"
ADMIN_EMAIL="ваша_пошта@gmail.com"

# URL
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost/course__udemy/backend/api"
```

> **Підказка:** Для Gmail треба увімкнути [двоетапну перевірку](https://myaccount.google.com/security) та згенерувати **пароль додатку** (App Password).

#### 3.3 Встановлення PHP-залежностей

```bash
cd backend
composer install
```

---

### 4. Налаштування Frontend

#### 4.1 Встановлення залежностей

```bash
cd frontend
npm install
```

#### 4.2 Адреса API

Переконайтеся, що в [`frontend/src/api/config.js`](frontend/src/api/config.js) вказано правильний URL:

```js
export const API_URL = 'http://localhost/course__udemy/backend/api/'
```

#### 4.3 Запуск dev-сервера

```bash
cd frontend
npm run dev
```

Додаток буде доступний за адресою: **http://localhost:5173**

#### 4.4 Запуск автоматизованих тестів (Vitest)

Для запуску тестів у одноразовому режимі:
```bash
npm run test
```

Для запуску тестів в інтерактивному watch-режимі (автоматичний перезапуск при зміні коду):
```bash
npm run test:watch
```

#### 4.5 Production збірка

```bash
npm run build
npm run preview
```

---

## 📦 Імпорт товарів

### Варіант A: Імпорт з Excel (.xlsx)

Покладіть Excel-файл каталогу постачальника в корінь проекту і відкрийте в браузері:

```
http://localhost/course__udemy/backend/scripts/import_products.php
```

**Параметри URL:**
| Параметр | Опис | Приклад |
|---|---|---|
| `file` | Ім'я Excel-файлу | `?file=catalog_dropt_2026-07-12.xlsx` |
| `reset=1` | Очистити і переімпортувати все | `?reset=1` |
| `markup` | Відсоток націнки на ціни | `?markup=20` |

**Повний скид і реімпорт:**
```
http://localhost/course__udemy/backend/scripts/import_products.php?reset=1
```

### Варіант B: Імпорт з YML/XML (Dropt API)

```
http://localhost/course__udemy/backend/scripts/import_xml.php
```

### Логіка категоризації

Скрипт автоматично визначає **кореневу категорію** за назвою підкатегорії з каталогу за допомогою файлу [`backend/includes/category_helpers.php`](backend/includes/category_helpers.php).

**Пріоритетні перевірки (запобігають хибним збігам):**
- `бритв`, `стриж`, `тример`, `епілятор` → **Краса та здоров'я** (а не Автотовари!)
- `кавомаш`, `кавовар`, `кофевар` → **Побутова техніка**
- `болгарк`, `перфоратор`, `шуруповерт` → **Інструменти та ремонт**
- `автокрісл`, `автокресл` → **Дитячі товари та іграшки**

---

## ⚙️ Автоматизація (Cron)

Для автоматичного оновлення товарів та цін налаштуйте Cron-задачу на сервері:

```bash
# Кожну годину оновлювати товари з Excel-каталогу
0 * * * * php /шлях/до/проекту/backend/scripts/import_products.php > /dev/null 2>&1

# Або з YML/XML джерела
0 * * * * php /шлях/до/проекту/backend/scripts/import_xml.php > /dev/null 2>&1
```

---

## 🔐 Безпека

- Паролі хешуються через `password_hash()` (bcrypt)
- Авторизація через **JWT-токени** (зберігаються в `localStorage`)
- Захист від SQL-ін'єкцій через **prepared statements** (MySQLi)
- CORS налаштований лише для дозволених Origins у `.env`
- Верифікація email через унікальний 6-символьний код

---

## 📝 Ліцензія

MIT — вільне використання для навчальних та комерційних цілей.
