import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Import routers
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import importRoutes from "./routes/importRoutes.js";

// Import controllers directly for PHP compatibility layer
import * as userCtrl from "./controllers/userController.js";
import * as catCtrl from "./controllers/categoryController.js";
import * as prodCtrl from "./controllers/productController.js";
import * as ordCtrl from "./controllers/orderController.js";
import * as impCtrl from "./controllers/importController.js";
import authMiddleware from "./middleware/authMiddleware.js";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup uploads folder mapping (project root /uploads)
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Create temp upload directory for multer
const tempUploads = path.join(__dirname, "uploads");
if (!fs.existsSync(tempUploads)) {
  fs.mkdirSync(tempUploads, { recursive: true });
}
const upload = multer({ dest: "backend/uploads/" });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/dropshop")
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

// ── Clean REST API routes ──────────────────────────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/import", importRoutes);

// ── PHP Compatibility Layer (Maps legacy endpoints to controllers) ─────────
app.get("/api/categories.php", catCtrl.getCategoriesTree);
app.get("/api/get_category_by_id.php", catCtrl.getCategoryById);
app.get("/api/get_products_by_category.php", prodCtrl.getProductsByCategory);
app.get("/api/products.php", prodCtrl.getProducts);
app.get("/api/product-details.php", prodCtrl.getProductById);
app.get("/api/get_discounted_products.php", prodCtrl.getDiscountedProducts);
app.post("/api/set_discount.php", authMiddleware, prodCtrl.setDiscount);

app.get("/api/admin_category_crud.php", authMiddleware, catCtrl.adminCategoryGet);
app.post("/api/admin_category_crud.php", authMiddleware, catCtrl.adminCategoryCrud);
app.post("/api/admin_product_crud.php", authMiddleware, prodCtrl.adminProductCrud);

app.post("/api/login.php", userCtrl.loginUser);
app.post("/api/register.php", userCtrl.registerUser);
app.post("/api/verify_email.php", userCtrl.verifyEmail);
app.post("/api/reset_password_request.php", userCtrl.requestPasswordReset);
app.post("/api/reset_password.php", userCtrl.resetPassword);

app.get("/api/get_orders.php", authMiddleware, ordCtrl.getOrders);
app.get("/api/get_profile.php", authMiddleware, userCtrl.getProfile);
app.post("/api/update_profile.php", authMiddleware, userCtrl.updateProfile);

app.get("/api/order.php", (req, res, next) => {
  if (req.query.generate_user_id) {
    return ordCtrl.generateGuestUserId(req, res);
  }
  next();
}, ordCtrl.createOrder);
app.post("/api/order.php", ordCtrl.createOrder);

app.post("/api/upload_catalog.php", authMiddleware, upload.single("catalog"), impCtrl.uploadCatalog);
app.get("/api/get_uploaded_catalogs.php", authMiddleware, impCtrl.getCatalogs);
app.post("/api/delete_catalog.php", authMiddleware, impCtrl.deleteCatalog);
app.get("/api/get_stats.php", impCtrl.getStats);
app.post("/api/upload_image.php", authMiddleware, upload.single("image"), impCtrl.uploadImage);

// Excel and XML import scripts routing
app.get("/backend/scripts/import_products.php", (req, res, next) => {
  req.startTime = performance.now();
  next();
}, impCtrl.importProductsXlsx);

app.get("/backend/scripts/import_xml.php", (req, res, next) => {
  req.startTime = performance.now();
  next();
}, impCtrl.importXml);

// Serve frontend static build files if they exist
const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA routing fallback
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Serve server port
app.listen(PORT, () => {
  console.log(`🚀 Node Server running on port ${PORT}`);
});
