import Category from "../models/Category.js";
import Product from "../models/Product.js";

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

// Helper to find the first product image in descendant categories
const getCategoryImageFallback = async (categoryId, fallbackName) => {
  try {
    const descendantIds = await getDescendantCategoryIds(categoryId);
    const product = await Product.findOne({
      categoryId: { $in: descendantIds },
      image: { $ne: "" },
    }).select("image");

    if (product && product.image) {
      return product.image;
    }
  } catch (error) {
    console.error("Error getting category image fallback:", error);
  }
  return `https://placehold.co/400x300/f1f5f9/94a3b8?text=${encodeURIComponent(fallbackName)}`;
};

// 🟢 Отримати дерево категорій (categories.php)
export const getCategoriesTree = async (req, res) => {
  try {
    const roots = await Category.find({ parentId: null }).sort({ name: 1 }).lean();
    const categories = [];

    for (const root of roots) {
      const subcategories = await Category.find({ parentId: root._id }).sort({ name: 1 }).select("_id name").lean();
      
      const mappedSubcategories = subcategories.map((sub) => ({
        id: sub._id,
        name: sub.name,
      }));

      let image = root.image;
      if (!image) {
        image = await getCategoryImageFallback(root._id, root.name);
      }

      categories.push({
        id: root._id,
        name: root.name,
        image,
        subcategories: mappedSubcategories,
      });
    }

    res.json(categories);
  } catch (error) {
    console.error("Get categories tree error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🟢 Отримати категорію по ID (get_category_by_id.php)
export const getCategoryById = async (req, res) => {
  const categoryId = Number(req.query.category_id || req.params.id);

  if (!categoryId) {
    return res.status(400).json({ error: "Не вказано ID категорії" });
  }

  try {
    const category = await Category.findById(categoryId).lean();
    if (!category) {
      return res.status(404).json({ error: "Категорія не знайдена" });
    }

    let parentCategory = null;
    if (category.parentId) {
      const parent = await Category.findById(category.parentId).select("_id name").lean();
      if (parent) {
        parentCategory = {
          id: parent._id,
          name: parent.name,
        };
      }
    }

    const subList = await Category.find({ parentId: categoryId }).sort({ name: 1 }).lean();
    const subcategories = [];

    for (const sub of subList) {
      let image = sub.image;
      if (!image) {
        image = await getCategoryImageFallback(sub._id, sub.name);
      }

      subcategories.push({
        id: sub._id,
        name: sub.name,
        image,
      });
    }

    res.json({
      id: category._id,
      name: category.name,
      parent_id: category.parentId,
      image: category.image || await getCategoryImageFallback(category._id, category.name),
      parent_category: parentCategory,
      subcategories,
    });
  } catch (error) {
    console.error("Get category by ID error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🟢 CRUD для категорій (admin_category_crud.php)
export const adminCategoryGet = async (req, res) => {
  try {
    const list = await Category.find().sort({ name: 1 }).lean();
    const categories = list.map((c) => ({
      id: c._id,
      name: c.name,
      parent_id: c.parentId,
      image: c.image,
    }));

    res.json({ status: "success", categories });
  } catch (error) {
    console.error("Admin categories list error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const adminCategoryCrud = async (req, res) => {
  const { action, name, parent_id, image, id } = req.body;

  if (action === "create") {
    const catName = trim(name || "");
    const parentId = parent_id !== undefined && parent_id !== "" ? Number(parent_id) : null;
    const catImage = image !== undefined && image !== "" ? trim(image) : null;

    if (!catName) {
      return res.status(400).json({ status: "error", message: "Назва категорії обовʼязкова" });
    }

    try {
      // Find next category ID starting from 1000000
      const maxCat = await Category.findOne().sort({ _id: -1 }).select("_id").lean();
      const nextId = Math.max(1000000, maxCat ? maxCat._id : 1000000) + 1;

      const newCategory = new Category({
        _id: nextId,
        name: catName,
        parentId,
        image: catImage || "",
      });

      await newCategory.save();
      res.json({ status: "success", message: "Категорію успішно створено", id: nextId });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Помилка бази даних: " + error.message });
    }
  } else if (action === "update") {
    const catId = Number(id);
    const catName = trim(name || "");
    const parentId = parent_id !== undefined && parent_id !== "" ? Number(parent_id) : null;
    const catImage = image !== undefined && image !== "" ? trim(image) : null;

    if (!catId || !catName) {
      return res.status(400).json({ status: "error", message: "Некоректні дані категорії" });
    }

    if (catId === parentId) {
      return res.status(400).json({ status: "error", message: "Категорія не може бути батьківською сама для себе" });
    }

    try {
      const category = await Category.findById(catId);
      if (!category) {
        return res.status(404).json({ status: "error", message: "Категорія не знайдена" });
      }

      category.name = catName;
      category.parentId = parentId;
      category.image = catImage || "";
      await category.save();

      res.json({ status: "success", message: "Категорію успішно оновлено" });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Помилка бази даних: " + error.message });
    }
  } else if (action === "delete") {
    const catId = Number(id);

    if (!catId) {
      return res.status(400).json({ status: "error", message: "Некоректний ID категорії" });
    }

    try {
      await Category.findByIdAndDelete(catId);
      res.json({ status: "success", message: "Категорію успішно видалено" });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Помилка бази даних: " + error.message });
    }
  } else {
    res.status(400).json({ status: "error", message: "Невідома дія" });
  }
};

const trim = (str) => typeof str === "string" ? str.trim() : str;
