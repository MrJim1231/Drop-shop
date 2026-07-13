import Product from "../models/Product.js";
import Category from "../models/Category.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import xlsx from "xlsx";
import { XMLParser } from "fast-xml-parser";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "../..");

// 🟢 Отримати статистику (get_stats.php)
export const getStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Group products by supplier
    const supplierStats = await Product.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$supplier", "Інші / Невідомо"] },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      status: "success",
      data: {
        total_products: totalProducts,
        total_categories: totalCategories,
        suppliers: supplierStats,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 🟢 Завантажити каталог на сервер (upload_catalog.php)
export const uploadCatalog = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: "error", message: "Помилка завантаження файлу" });
  }

  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  if (fileExtension !== ".xlsx") {
    // Clean up file if not xlsx
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ status: "error", message: "Будь ласка, завантажте файл у форматі .xlsx" });
  }

  try {
    const safeFileName = req.file.originalname.replace(/[^a-zA-Z0-9_\.-]/g, "_");
    const destPath = path.join(rootDir, safeFileName);

    fs.renameSync(req.file.path, destPath);

    res.json({
      status: "success",
      message: `Каталог '${safeFileName}' успішно завантажено`,
    });
  } catch (error) {
    console.error("Upload catalog error:", error);
    res.status(500).json({ status: "error", message: "Не вдалося зберегти файл на сервері" });
  }
};

// 🟢 Отримати завантажені каталоги (get_uploaded_catalogs.php)
export const getCatalogs = async (req, res) => {
  try {
    const files = fs.readdirSync(rootDir);
    const xlsxFiles = files.filter((f) => f.endsWith(".xlsx"));

    const result = xlsxFiles.map((file) => {
      const filePath = path.join(rootDir, file);
      const stat = fs.statSync(filePath);
      const sizeMB = (stat.size / (1024 * 1024)).toFixed(2) + " MB";
      const uploadedAt = stat.mtime.toISOString().replace("T", " ").substring(0, 19);

      return {
        name: file,
        size: sizeMB,
        uploaded_at: uploadedAt,
      };
    });

    // Sort: newest first
    result.sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));

    res.json(result);
  } catch (error) {
    console.error("Get catalogs list error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 🟢 Видалити каталог (delete_catalog.php)
export const deleteCatalog = async (req, res) => {
  const { fileName } = req.body;

  if (!fileName) {
    return res.status(400).json({ status: "error", message: "Ім'я файлу не вказано" });
  }

  const cleanFileName = path.basename(fileName);
  if (!cleanFileName.endsWith(".xlsx")) {
    return res.status(400).json({ status: "error", message: "Дозволено видаляти лише .xlsx файли" });
  }

  try {
    const filePath = path.join(rootDir, cleanFileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ status: "success", message: `Каталог '${cleanFileName}' успішно видалено` });
    } else {
      res.status(404).json({ status: "error", message: "Файл не знайдено" });
    }
  } catch (error) {
    console.error("Delete catalog error:", error);
    res.status(500).json({ status: "error", message: "Не вдалося видалити файл" });
  }
};

// 🟢 Завантажити зображення (upload_image.php)
export const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: "error", message: "Помилка завантаження файлу" });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  if (!allowed.includes(ext)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      status: "error",
      message: "Недозволений формат файлу. Дозволені лише JPG, JPEG, PNG, GIF, WEBP",
    });
  }

  try {
    const uploadsDir = path.join(rootDir, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const newFileName = crypto.randomUUID() + ext;
    const destPath = path.join(uploadsDir, newFileName);
    fs.renameSync(req.file.path, destPath);

    // Build URL (we return a clean relative URL so the proxy handles it correctly)
    const fileUrl = `/uploads/${newFileName}`;

    res.json({
      status: "success",
      message: "Зображення успішно завантажено",
      url: fileUrl,
    });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({ status: "error", message: "Помилка збереження файлу на сервері" });
  }
};

// ── STREAMING LOGS GENERATOR ──────────────────────────────────────────────

const getHtmlHeader = (title) => `
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 20px auto; padding: 0 15px; color: #1e293b; background: #0f172a; color: #f8fafc; }
    .ok { color: #10b981; }
    .warn { color: #f59e0b; }
    .err { color: #ef4444; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; background: #1e293b; border-radius: 8px; overflow: hidden; }
    td, th { border: 1px solid #334155; padding: 10px 14px; text-align: left; }
    th { background: #334155; color: #cbd5e1; }
    ul { list-style: none; padding: 0; font-family: monospace; font-size: 13px; color: #94a3b8; }
    li { margin-bottom: 4px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
`;

// 🟢 Імпорт з Excel (import_products.php)
export const importProductsXlsx = async (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  res.write(getHtmlHeader("Імпорт каталогу DropShop (Excel)"));
  
  const isReset = req.query.reset !== undefined;
  const markup = parseFloat(req.query.markup) || 0.0;
  const fileName = req.query.file || "catalog_dropt_2026-07-12.xlsx";
  const safeFileName = path.basename(fileName);
  const catalogFilePath = path.join(rootDir, safeFileName);

  if (!fs.existsSync(catalogFilePath)) {
    res.write(`<p class="err">Файл не знайдено: ${safeFileName}</p></body></html>`);
    return res.end();
  }

  res.write(`<p>Читаю Excel-файл <strong>${safeFileName}</strong>...</p>`);

  try {
    if (isReset) {
      await Product.deleteMany({});
      await Category.deleteMany({});
      res.write('<p class="warn">Базу даних товарів та категорій очищено.</p>');
    }

    const workbook = xlsx.readFile(catalogFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
      res.write('<p class="err">Файл порожній або без даних.</p></body></html>');
      return res.end();
    }

    // Build headers maps
    const headers = rows[0].map((h) => String(h || "").trim());
    const columnMap = {};
    headers.forEach((header, index) => {
      const normalized = header.toLowerCase();
      if (header === "SKU") columnMap.sku = index;
      else if (normalized.includes("назва") && normalized.includes("укр")) columnMap.name_uk = index;
      else if (normalized.includes("опис") && normalized.includes("укр")) columnMap.desc_uk = index;
      else if (normalized.includes("дроп") && normalized.includes("ціна")) columnMap.price = index;
      else if (normalized === "категорії" || normalized === "категории") columnMap.category = index;
      else if (normalized === "наявність" || normalized === "наличие") columnMap.availability = index;
      else if (normalized.includes("головне фото")) columnMap.main_image = index;
      else if (normalized.includes("додаткові фото") || normalized.includes("дополнительные фото")) columnMap.extra_images = index;
    });

    // Check critical headers
    const required = ["sku", "name_uk", "price", "category", "main_image"];
    for (const reqKey of required) {
      if (columnMap[reqKey] === undefined) {
        res.write(`<p class="err">У файлі Excel не знайдено колонку: ${reqKey}</p></body></html>`);
        return res.end();
      }
    }

    const totalRows = rows.length - 1;
    res.write(`<p>Імпорт ${totalRows} товарів...</p><ul id="progress">`);

    let nextCategoryId = 1000001;
    const maxCat = await Category.findOne({ _id: { $gte: 1000000 } }).sort({ _id: -1 }).select("_id").lean();
    if (maxCat) {
      nextCategoryId = maxCat._id + 1;
    }

    const categoryCache = {};
    const dbCats = await Category.find().lean();
    dbCats.forEach((c) => {
      categoryCache[c.name.trim()] = c._id;
    });

    const stats = {
      total_rows: totalRows,
      categories_created: 0,
      products_added: 0,
      products_updated: 0,
      images_added: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const sku = String(row[columnMap.sku] || "").trim();
      if (!sku) {
        stats.skipped++;
        continue;
      }

      const name = String(row[columnMap.name_uk] || "").trim();
      const description = String(row[columnMap.desc_uk] || "").trim();
      let price = parseFloat(String(row[columnMap.price] || "").replace(",", "."));

      if (isNaN(price)) price = 0.0;
      if (markup > 0) {
        price = Math.round(price * (1 + markup / 100) * 100) / 100;
      }

      const categoryName = String(row[columnMap.category] || "").trim();
      const availabilityText = String(row[columnMap.availability] || "").trim().toLowerCase();
      const mainImage = String(row[columnMap.main_image] || "").trim();
      const extraImagesText = String(row[columnMap.extra_images] || "").trim();

      if (name === "" || price <= 0 || categoryName === "") {
        stats.skipped++;
        if (stats.errors.length < 50) {
          stats.errors.push(`Рядок ${i}: пропущено, SKU=${sku}`);
        }
        continue;
      }

      // Find or create category
      let categoryId = categoryCache[categoryName];
      if (!categoryId) {
        let dbCat = await Category.findOne({ name: new RegExp(`^${categoryName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') });
        if (dbCat) {
          categoryId = dbCat._id;
        } else {
          categoryId = nextCategoryId++;
          try {
            dbCat = await Category.create({
              _id: categoryId,
              name: categoryName,
              parentId: null,
              image: "",
            });
            stats.categories_created++;
          } catch (err) {
            dbCat = await Category.findOne({ name: new RegExp(`^${categoryName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') });
            if (dbCat) {
              categoryId = dbCat._id;
            } else {
              throw err;
            }
          }
        }
        categoryCache[categoryName] = categoryId;
      }

      const availability = availabilityText === "" || availabilityText.includes("наявн") || availabilityText.includes("налич");
      const quantityInStock = availability ? 1 : 0;

      // Extract images list
      const imagesList = [];
      if (mainImage) imagesList.push(mainImage);
      if (extraImagesText) {
        extraImagesText.split("|").forEach((img) => {
          const trimmed = img.trim();
          if (trimmed && !imagesList.includes(trimmed)) {
            imagesList.push(trimmed);
          }
        });
      }

      stats.images_added += imagesList.length;

      // Check if product exists
      const existingProduct = await Product.findById(sku);
      if (existingProduct) {
        existingProduct.categoryId = categoryId;
        existingProduct.name = name;
        existingProduct.description = description;
        existingProduct.price = price;
        existingProduct.availability = availability;
        existingProduct.quantityInStock = quantityInStock;
        existingProduct.supplier = safeFileName;
        existingProduct.image = mainImage;
        existingProduct.images = imagesList;
        await existingProduct.save();
        stats.products_updated++;
      } else {
        const newProd = new Product({
          _id: sku,
          categoryId,
          name,
          description,
          price,
          availability,
          quantityInStock,
          supplier: safeFileName,
          image: mainImage,
          images: imagesList,
        });
        await newProd.save();
        stats.products_added++;
      }

      if (i % 200 === 0) {
        res.write(`<li>Оброблено ${i} / ${totalRows}...</li>`);
      }
    }

    res.write("</ul><p>Оновлюю зображення категорій...</p>");

    // Update root category fallback images if empty
    const roots = await Category.find({ image: { $in: ["", null] } });
    for (const r of roots) {
      const items = await Category.find({ parentId: r._id }).select("_id");
      const subIds = items.map((c) => c._id);
      subIds.push(r._id);

      const firstProduct = await Product.findOne({
        categoryId: { $in: subIds },
        image: { $ne: "" },
      }).select("image");

      if (firstProduct && firstProduct.image) {
        r.image = firstProduct.image;
        await r.save();
      }
    }

    const elapsed = (performance.now() - req.startTime) / 1000;
    
    const categoriesCount = await Category.countDocuments();
    const productsCount = await Product.countDocuments();

    res.write(`
      <h2 class="ok">Імпорт завершено!</h2>
      <table>
        <tr><th>Показник</th><th>Значення</th></tr>
        <tr><td>Рядків у Excel-файлі</td><td>${stats.total_rows}</td></tr>
        <tr><td>Категорій створено за цей запуск</td><td>${stats.categories_created}</td></tr>
        <tr><td><strong>Всього категорій у БД</strong></td><td><strong>${categoriesCount}</strong></td></tr>
        <tr><td>Товарів додано</td><td class="ok">${stats.products_added}</td></tr>
        <tr><td>Товарів оновлено</td><td>${stats.products_updated}</td></tr>
        <tr><td><strong>Всього товарів у БД</strong></td><td><strong>${productsCount}</strong></td></tr>
        <tr><td>Пропущено рядків</td><td>${stats.skipped}</td></tr>
      </table>
    `);

    if (stats.errors.length > 0) {
      res.write("<h3>Попередження (перші 20)</h3><ul>");
      stats.errors.slice(0, 20).forEach((err) => {
        res.write(`<li>${err}</li>`);
      });
      res.write("</ul>");
    }

    res.write('<p><a href="/" target="_parent">Перейти на сайт</a></p>');
    res.write("</body></html>");
    res.end();
  } catch (error) {
    console.error("XLSX Import Error:", error);
    res.write(`</ul><p class="err">Помилка імпорту: ${error.message}</p></body></html>`);
    res.end();
  }
};

// 🟢 Імпорт з XML/YML за посиланням (import_xml.php)
export const importXml = async (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  res.write(getHtmlHeader("Імпорт каталогу DropShop (XML/YML)"));

  const url = req.query.url ? req.query.url.trim() : "";
  const isReset = req.query.reset !== undefined;
  const markup = parseFloat(req.query.markup) || 0.0;

  if (!url) {
    res.write('<p class="err">Помилка: не вказано посилання на XML файл (параметр ?url=)</p></body></html>');
    return res.end();
  }

  res.write(`<p>Завантажую XML файл: <strong>${url}</strong>...</p>`);

  try {
    if (isReset) {
      await Product.deleteMany({});
      await Category.deleteMany({});
      res.write('<p class="warn">Базу даних товарів та категорій очищено.</p>');
    }

    const response = await axios.get(url, { responseType: "text" });
    const xmlContent = response.data;

    res.write("<p>Аналізую XML структуру...</p>");

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    
    const jsonObj = parser.parse(xmlContent);
    const shop = jsonObj.yml_catalog?.shop || jsonObj.shop;

    if (!shop) {
      res.write('<p class="err">Помилка парсингу XML: невірний YML/XML формат</p></body></html>');
      return res.end();
    }

    const shopName = shop.name || "Невідомий постачальник";
    res.write(`<p>Постачальник: <strong>${shopName}</strong></p>`);

    // 1. IMPORT CATEGORIES
    let xmlCategories = shop.categories?.category || [];
    if (!Array.isArray(xmlCategories)) {
      xmlCategories = [xmlCategories];
    }

    res.write(`<p>Імпорт ${xmlCategories.length} категорій з XML...</p>`);

    for (const cat of xmlCategories) {
      const id = Number(cat["@_id"]);
      const name = String(cat["#text"] || cat).trim();
      const parentId = cat["@_parentId"] ? Number(cat["@_parentId"]) : null;

      if (!id || !name) continue;

      await Category.findByIdAndUpdate(
        id,
        { name, parentId },
        { upsert: true, new: true }
      );
    }

    res.write('<p class="ok">Категорії успішно імпортовано.</p>');

    // 2. IMPORT PRODUCTS
    let offers = shop.offers?.offer || [];
    if (!Array.isArray(offers)) {
      offers = [offers];
    }

    res.write(`<p>Імпорт ${offers.length} товарів...</p><ul id="progress">`);

    const stats = {
      products_added: 0,
      products_updated: 0,
      skipped: 0,
    };

    let counter = 0;
    for (const offer of offers) {
      counter++;
      let sku = String(offer.vendorCode || "").trim();
      if (!sku) {
        sku = String(offer["@_id"] || "").trim();
      }

      if (!sku) {
        stats.skipped++;
        continue;
      }

      const name = String(offer.name_ua || offer.name || "").trim();
      const description = String(offer.description_ua || offer.description || "").trim();
      let price = parseFloat(offer.price || 0.0);

      if (markup > 0) {
        price = Math.round(price * (1 + markup / 100) * 100) / 100;
      }

      const categoryId = Number(offer.categoryId);
      const availableAttr = offer["@_available"];
      const availability = availableAttr === "true" || availableAttr === true || availableAttr === undefined;
      const quantityInStock = availability ? 1 : 0;
      const supplier = shopName;

      if (name === "" || price <= 0 || !categoryId) {
        stats.skipped++;
        continue;
      }

      // Collect images
      const imagesList = [];
      if (offer.picture) {
        const pics = Array.isArray(offer.picture) ? offer.picture : [offer.picture];
        pics.forEach((p) => {
          const cleanUrl = String(p).trim();
          if (cleanUrl && !imagesList.includes(cleanUrl)) {
            imagesList.push(cleanUrl);
          }
        });
      }

      const mainImage = imagesList[0] || "";

      const existingProduct = await Product.findById(sku);
      if (existingProduct) {
        existingProduct.categoryId = categoryId;
        existingProduct.name = name;
        existingProduct.description = description;
        existingProduct.price = price;
        existingProduct.availability = availability;
        existingProduct.quantityInStock = quantityInStock;
        existingProduct.supplier = supplier;
        existingProduct.image = mainImage;
        existingProduct.images = imagesList;
        await existingProduct.save();
        stats.products_updated++;
      } else {
        const newProd = new Product({
          _id: sku,
          categoryId,
          name,
          description,
          price,
          availability,
          quantityInStock,
          supplier,
          image: mainImage,
          images: imagesList,
        });
        await newProd.save();
        stats.products_added++;
      }

      if (counter % 200 === 0) {
        res.write(`<li>Оброблено ${counter} / ${offers.length}...</li>`);
      }
    }

    res.write("</ul><p>Оновлюю зображення категорій...</p>");

    // Update root category fallbacks
    const roots = await Category.find({ image: { $in: ["", null] } });
    for (const r of roots) {
      const items = await Category.find({ parentId: r._id }).select("_id");
      const subIds = items.map((c) => c._id);
      subIds.push(r._id);

      const firstProduct = await Product.findOne({
        categoryId: { $in: subIds },
        image: { $ne: "" },
      }).select("image");

      if (firstProduct && firstProduct.image) {
        r.image = firstProduct.image;
        await r.save();
      }
    }

    const categoriesCount = await Category.countDocuments();
    const productsCount = await Product.countDocuments();

    res.write(`
      <h2 class="ok">Імпорт завершено!</h2>
      <table>
        <tr><th>Показник</th><th>Значення</th></tr>
        <tr><td>Всього товарів оброблено</td><td>${offers.length}</td></tr>
        <tr><td>Товарів додано</td><td class="ok">${stats.products_added}</td></tr>
        <tr><td>Товарів оновлено</td><td>${stats.products_updated}</td></tr>
        <tr><td><strong>Всього товарів у БД</strong></td><td><strong>${productsCount}</strong></td></tr>
        <tr><td><strong>Всього категорій у БД</strong></td><td><strong>${categoriesCount}</strong></td></tr>
        <tr><td>Пропущено товарів</td><td>${stats.skipped}</td></tr>
      </table>
      <p><a href="/" target="_parent">Перейти на сайт</a></p>
      </body></html>
    `);
    res.end();
  } catch (error) {
    console.error("XML Import Error:", error);
    res.write(`</ul><p class="err">Помилка імпорту: ${error.message}</p></body></html>`);
    res.end();
  }
};
