import Product from "../models/Product.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configuration
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ Помилка: MONGO_URI не вказано в .env файлі.");
  process.exit(1);
}

// Parse Command Line Arguments
const args = process.argv.slice(2);
const isReset = args.includes("--reset");

let markup = 0;
const markupArg = args.find((a) => a.startsWith("--markup="));
if (markupArg) {
  markup = parseFloat(markupArg.split("=")[1]) || 0;
}

let fileArg = "catalog_dropt_2026-07-12.xlsx";
const fileParam = args.find((a) => a.startsWith("--file="));
if (fileParam) {
  fileArg = fileParam.split("=")[1];
}

const rootDir = path.join(__dirname, "../..");
const catalogFilePath = path.join(rootDir, fileArg);

async function run() {
  if (!fs.existsSync(catalogFilePath)) {
    console.error(`❌ Помилка: Файл не знайдено за шляхом: ${catalogFilePath}`);
    process.exit(1);
  }

  console.log(`🔌 Підключення до MongoDB...`);
  await mongoose.connect(MONGO_URI);
  console.log("✅ Підключено успішно.");

  try {
    if (isReset) {
      console.log("🧹 Очищення бази даних товарів та категорій...");
      await Product.deleteMany({});
      await Category.deleteMany({});
      console.log("✅ Базу очищено.");
    }

    console.log(`📖 Читання Excel файлу: ${fileArg}...`);
    const workbook = xlsx.readFile(catalogFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
      console.error("❌ Помилка: Excel файл порожній.");
      process.exit(1);
    }

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
      else if (normalized.includes("додаткові фото")) columnMap.extra_images = index;
    });

    const required = ["sku", "name_uk", "price", "category", "main_image"];
    for (const reqKey of required) {
      if (columnMap[reqKey] === undefined) {
        console.error(`❌ Помилка: Не знайдено колонку: ${reqKey}`);
        process.exit(1);
      }
    }

    const totalRows = rows.length - 1;
    console.log(`📦 Початок імпорту ${totalRows} товарів...`);

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

    let countAdded = 0;
    let countUpdated = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const sku = String(row[columnMap.sku] || "").trim();
      if (!sku) continue;

      const name = String(row[columnMap.name_uk] || "").trim();
      const description = String(row[columnMap.desc_uk] || "").trim();
      let price = parseFloat(String(row[columnMap.price] || "").replace(",", "."));

      if (isNaN(price)) price = 0.0;
      if (markup > 0) {
        price = Math.round(price * (1 + markup / 100));
      }

      const categoryName = String(row[columnMap.category] || "").trim() || "Інші товари";
      const availabilityText = String(row[columnMap.availability] || "").trim().toLowerCase();
      const available = availabilityText.includes("в наявності") || availabilityText.includes("есть в наличии") || availabilityText === "true" || availabilityText === "1";

      const mainImage = String(row[columnMap.main_image] || "").trim();
      const extraImagesText = String(row[columnMap.extra_images] || "").trim();
      const images = [mainImage];
      if (extraImagesText) {
        extraImagesText.split("|").forEach((img) => {
          const trimmed = img.trim();
          if (trimmed && !images.includes(trimmed)) {
            images.push(trimmed);
          }
        });
      }

      // Resolve Category ID
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
              image: mainImage,
            });
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

      // Upsert Product
      const productData = {
        categoryId,
        name,
        description,
        price,
        image: mainImage,
        images,
        availability: available,
        quantityInStock: available ? 15 : 0,
        supplier: "Dropt",
      };

      const existingProduct = await Product.findById(sku);
      if (existingProduct) {
        await Product.updateOne({ _id: sku }, productData);
        countUpdated++;
      } else {
        await Product.create({ _id: sku, ...productData });
        countAdded++;
      }

      if (i % 100 === 0 || i === rows.length - 1) {
        console.log(`⏳ Оброблено товарів: ${i}/${totalRows}...`);
      }
    }

    console.log("=========================================");
    console.log("✅ Імпорт завершено успішно!");
    console.log(`➕ Додано нових товарів: ${countAdded}`);
    console.log(`📝 Оновлено товарів: ${countUpdated}`);
    console.log("=========================================");

  } catch (error) {
    console.error("❌ Помилка імпорту:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
