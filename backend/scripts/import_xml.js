import Product from "../models/Product.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";
import { XMLParser } from "fast-xml-parser";
import axios from "axios";
import path from "path";
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

let xmlUrl = "";
const urlArg = args.find((a) => a.startsWith("--url="));
if (urlArg) {
  xmlUrl = urlArg.split("=")[1];
}

let markup = 0;
const markupArg = args.find((a) => a.startsWith("--markup="));
if (markupArg) {
  markup = parseFloat(markupArg.split("=")[1]) || 0;
}

if (!xmlUrl) {
  console.error("❌ Помилка: Вкажіть посилання на XML фід через аргумент --url=https://example.com/feed.xml");
  process.exit(1);
}

async function run() {
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

    console.log(`📥 Завантаження XML фідy за посиланням: ${xmlUrl}...`);
    const response = await axios.get(xmlUrl, { responseType: "text" });
    const xmlContent = response.data;
    console.log("✅ XML завантажено.");

    console.log("⚙️ Аналіз XML структури...");
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });
    const jsonObj = parser.parse(xmlContent);

    const shop = jsonObj.yml_catalog?.shop || jsonObj.shop;
    if (!shop) {
      throw new Error("Невідома структура XML. Очікується <shop> або <yml_catalog>");
    }

    const shopName = shop.name || "Невідомий постачальник";
    console.log(`🏢 Постачальник: ${shopName}`);

    // 1. Import Categories
    const xmlCategoriesRaw = shop.categories?.category || [];
    const xmlCategories = Array.isArray(xmlCategoriesRaw) ? xmlCategoriesRaw : [xmlCategoriesRaw];

    console.log(`📁 Імпорт ${xmlCategories.length} категорій з XML...`);
    for (const cat of xmlCategories) {
      const id = parseInt(cat.id);
      const name = String(cat["#text"] || cat.name || "").trim();
      const parentId = parseInt(cat.parentId || cat.parent_id) || null;

      if (!id || !name) continue;

      const categoryData = {
        name,
        parent_id: parentId,
      };

      const existingCat = await Category.findById(id);
      if (existingCat) {
        await Category.findByIdAndUpdate(id, categoryData);
      } else {
        await Category.create({ _id: id, ...categoryData });
      }
    }
    console.log("✅ Імпорт категорій завершено.");

    // 2. Import Products
    const offersRaw = shop.offers?.offer || [];
    const offers = Array.isArray(offersRaw) ? offersRaw : [offersRaw];
    const totalOffers = offers.length;
    console.log(`🛍️ Імпорт ${totalOffers} товарів з XML...`);

    let countAdded = 0;
    let countUpdated = 0;

    for (let i = 0; i < offers.length; i++) {
      const offer = offers[i];
      const sku = String(offer.id || "").trim();
      if (!sku) continue;

      const name = String(offer.name || offer.title || "").trim();
      const description = String(offer.description || "").trim();
      let price = parseFloat(String(offer.price || "0").replace(",", "."));

      if (isNaN(price)) price = 0.0;
      if (markup > 0) {
        price = Math.round(price * (1 + markup / 100));
      }

      const categoryId = parseInt(offer.categoryId || offer.category_id);
      const availabilityText = String(offer.available || "").toLowerCase();
      const available = availabilityText === "true" || availabilityText === "1" || availabilityText === "yes";

      // Images parsing
      const picturesRaw = offer.picture || [];
      const pictures = Array.isArray(picturesRaw) ? picturesRaw : [picturesRaw];
      const mainImage = pictures[0] ? String(pictures[0]).trim() : "";
      const images = pictures.map((p) => String(p).trim()).filter(Boolean);

      const supplierName = String(offer.vendor || shopName).trim();

      const productData = {
        name,
        description,
        price,
        image: mainImage,
        images,
        category_id: categoryId || null,
        availability: available ? 1 : 0,
        quantity_in_stock: available ? 10 : 0,
        supplier: supplierName,
      };

      const existingProduct = await Product.findOne({ id: sku });
      if (existingProduct) {
        await Product.updateOne({ id: sku }, productData);
        countUpdated++;
      } else {
        await Product.create({ id: sku, ...productData });
        countAdded++;
      }

      if (i > 0 && (i % 200 === 0 || i === offers.length - 1)) {
        console.log(`⏳ Оброблено товарів: ${i}/${totalOffers}...`);
      }
    }

    console.log("=========================================");
    console.log("✅ Імпорт XML завершено успішно!");
    console.log(`➕ Додано нових товарів: ${countAdded}`);
    console.log(`📝 Оновлено товарів: ${countUpdated}`);
    console.log("=========================================");

  } catch (error) {
    console.error("❌ Помилка імпорту XML:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
