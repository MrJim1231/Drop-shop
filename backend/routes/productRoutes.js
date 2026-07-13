import express from "express";
import {
  getProducts,
  getProductsByCategory,
  getProductById,
  getDiscountedProducts,
  setDiscount,
  adminProductCrud,
} from "../controllers/productController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/category", getProductsByCategory);
router.get("/detail", getProductById);
router.get("/discounts", getDiscountedProducts);
router.post("/discount", authMiddleware, setDiscount);
router.post("/admin", authMiddleware, adminProductCrud);

export default router;
