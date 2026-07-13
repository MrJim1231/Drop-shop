import Product from "../models/Product.js";
import Category from "../models/Category.js";

// Helper to get descendant category IDs recursively
const getDescendantCategoryIds = async (categoryId) => {
  let ids = [Number(categoryId)];
  let searchIds = [Number(categoryId)];

  while (searchIds.length > 0) {
    const children = await Category.find({ parentId: { $in: searchIds } }).select("_id");
    const childIds = children.map((c) => Number(c._id));
    searchIds = childIds;
    ids = ids.concat(childIds);
  }
  return ids;
};

// 🟢 Отримати товари (products.php)
export const getProducts = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const skip = (page - 1) * limit;
  const q = req.query.q ? req.query.q.trim() : "";

  try {
    let filter = {};
    if (q) {
      filter = {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { _id: { $regex: q, $options: "i" } }, // SKU search
        ],
      };
    }

    const items = await Product.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const products = items.map((row) => {
      const discount = Number(row.discount || 0);
      const price = Number(row.price || 0);
      const discounted_price = discount > 0 ? Math.round((price * (1 - discount / 100)) * 100) / 100 : null;

      return {
        id: row._id,
        name: row.name,
        description: row.description,
        price,
        discount,
        discounted_price,
        image: row.image || row.images?.[0] || "",
        images: row.images || [],
        size: row.size,
        availability: row.availability ? 1 : 0,
        quantity_in_stock: row.quantityInStock || 0,
        weight: row.weight,
        category_id: row.categoryId,
        supplier: row.supplier,
      };
    });

    res.json({ products, total_pages: totalPages });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🟢 Отримати товари за категорією (get_products_by_category.php)
export const getProductsByCategory = async (req, res) => {
  const categoryId = Number(req.query.category_id || req.params.categoryId);

  if (!categoryId) {
    return res.status(400).json({ error: "Invalid category ID" });
  }

  try {
    const descendantIds = await getDescendantCategoryIds(categoryId);
    // Availability = true (or 1)
    const items = await Product.find({
      categoryId: { $in: descendantIds },
      availability: true,
    }).lean();

    const products = items.map((row) => {
      const discount = Number(row.discount || 0);
      const price = Number(row.price || 0);
      const discounted_price = discount > 0 ? Math.round((price * (1 - discount / 100)) * 100) / 100 : null;

      return {
        id: row._id,
        name: row.name,
        description: row.description,
        price,
        discount,
        discounted_price,
        image: row.image || row.images?.[0] || "",
        images: row.images || [],
        size: row.size,
        availability: row.availability ? 1 : 0,
        quantity_in_stock: row.quantityInStock || 0,
        weight: row.weight,
        category_id: row.categoryId,
        supplier: row.supplier,
      };
    });

    res.json(products);
  } catch (error) {
    console.error("Get products by category error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🟢 Отримати товар за ID (product-details.php)
export const getProductById = async (req, res) => {
  const productId = req.query.id || req.params.id;

  if (!productId) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  try {
    const product = await Product.findById(productId).populate("categoryId", "name parentId").lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const discount = Number(product.discount || 0);
    const price = Number(product.price || 0);
    const discounted_price = discount > 0 ? Math.round((price * (1 - discount / 100)) * 100) / 100 : null;

    res.json({
      id: product._id,
      name: product.name,
      description: product.description,
      price,
      discount,
      discounted_price,
      image: product.image || product.images?.[0] || "",
      images: product.images || [],
      size: product.size,
      availability: product.availability ? 1 : 0,
      quantity_in_stock: product.quantityInStock || 0,
      weight: product.weight,
      category_id: product.categoryId?._id || product.categoryId,
      category_name: product.categoryId?.name || "",
      parent_id: product.categoryId?.parentId || null,
      sizes: [],
      supplier: product.supplier,
    });
  } catch (error) {
    console.error("Get product details error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🟢 Знижки (get_discounted_products.php)
export const getDiscountedProducts = async (req, res) => {
  try {
    const items = await Product.find({ discount: { $gt: 0 } })
      .sort({ discount: -1 })
      .limit(100)
      .lean();

    const products = items.map((row) => {
      const discount = Number(row.discount || 0);
      const price = Number(row.price || 0);
      const discounted_price = discount > 0 ? Math.round((price * (1 - discount / 100)) * 100) / 100 : null;

      return {
        id: row._id,
        name: row.name,
        price,
        discount,
        discounted_price,
        size: row.size,
        availability: row.availability ? 1 : 0,
        image: row.image || row.images?.[0] || "",
      };
    });

    res.json({ status: "success", products, total: products.length });
  } catch (error) {
    console.error("Get discounted products error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 🟢 Встановити знижку (set_discount.php)
export const setDiscount = async (req, res) => {
  const { product_id, discount } = req.body;
  const discValue = parseInt(discount);

  if (!product_id) {
    return res.status(400).json({ status: "error", message: "product_id is required" });
  }

  if (isNaN(discValue) || discValue < 0 || discValue > 99) {
    return res.status(400).json({ status: "error", message: "Знижка повинна бути від 0 до 99 відсотків" });
  }

  try {
    const product = await Product.findByIdAndUpdate(
      product_id,
      { discount: discValue },
      { new: true }
    );

    if (product) {
      res.json({ status: "success", message: `Знижка ${discValue}% встановлена для товару` });
    } else {
      res.status(404).json({ status: "error", message: "Товар не знайдено" });
    }
  } catch (error) {
    console.error("Set discount error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 🟢 CRUD для продуктів (admin_product_crud.php)
export const adminProductCrud = async (req, res) => {
  const { action } = req.body;

  if (action === "create") {
    const {
      id,
      category_id,
      name,
      description,
      price,
      availability,
      size,
      quantity_in_stock,
      weight,
      supplier,
      image,
    } = req.body;

    const cleanId = trim(id || "");
    const cleanCategoryId = Number(category_id);
    const cleanName = trim(name || "");
    const cleanPrice = parseFloat(price || 0);

    if (cleanId === "" || cleanName === "" || cleanPrice <= 0 || !cleanCategoryId) {
      return res.status(400).json({
        status: "error",
        message: "Необхідно вказати ID (SKU), Назву, Категорію та Ціну (більше 0)",
      });
    }

    try {
      const exists = await Product.findById(cleanId);
      if (exists) {
        return res.status(400).json({ status: "error", message: "Товар з таким ID (SKU) вже існує" });
      }

      const mainImage = image ? trim(image) : "";
      const imagesList = mainImage ? [mainImage] : [];

      const newProduct = new Product({
        _id: cleanId,
        groupId: null,
        categoryId: cleanCategoryId,
        name: cleanName,
        description: description ? trim(description) : "",
        price: cleanPrice,
        size: size ? trim(size) : "",
        availability: availability !== 0,
        quantityInStock: parseInt(quantity_in_stock || 0),
        weight: weight ? parseFloat(weight) : null,
        supplier: supplier ? trim(supplier) : null,
        image: mainImage,
        images: imagesList,
      });

      await newProduct.save();
      res.json({ status: "success", message: "Товар успішно створено" });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Помилка бази даних: " + error.message });
    }
  } else if (action === "update") {
    const {
      id,
      category_id,
      name,
      description,
      price,
      availability,
      size,
      quantity_in_stock,
      weight,
      supplier,
      image,
    } = req.body;

    const cleanId = trim(id || "");
    const cleanCategoryId = Number(category_id);
    const cleanName = trim(name || "");
    const cleanPrice = parseFloat(price || 0);

    if (cleanId === "" || cleanName === "" || cleanPrice <= 0 || !cleanCategoryId) {
      return res.status(400).json({
        status: "error",
        message: "Необхідно вказати ID (SKU), Назву, Категорію та Ціну (більше 0)",
      });
    }

    try {
      const product = await Product.findById(cleanId);
      if (!product) {
        return res.status(404).json({ status: "error", message: "Товар не знайдено" });
      }

      product.categoryId = cleanCategoryId;
      product.name = cleanName;
      product.description = description ? trim(description) : "";
      product.price = cleanPrice;
      product.availability = availability !== 0;
      product.size = size ? trim(size) : "";
      product.quantityInStock = parseInt(quantity_in_stock || 0);
      product.weight = weight ? parseFloat(weight) : null;
      product.supplier = supplier ? trim(supplier) : null;

      if (image !== undefined && image !== "") {
        const mainImage = trim(image);
        product.image = mainImage;
        if (!product.images.includes(mainImage)) {
          product.images = [mainImage, ...product.images.filter((img) => img !== mainImage)];
        }
      }

      await product.save();
      res.json({ status: "success", message: "Товар успішно оновлено" });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Помилка бази даних: " + error.message });
    }
  } else if (action === "delete") {
    const cleanId = trim(req.body.id || "");

    if (cleanId === "") {
      return res.status(400).json({ status: "error", message: "Некоректний ID (SKU) товару" });
    }

    try {
      await Product.findByIdAndDelete(cleanId);
      res.json({ status: "success", message: "Товар успішно видалено" });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Помилка бази даних: " + error.message });
    }
  } else {
    res.status(400).json({ status: "error", message: "Невідома дія" });
  }
};

const trim = (str) => typeof str === "string" ? str.trim() : str;
