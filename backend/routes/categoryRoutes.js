import express from "express";
import {
  getCategoriesTree,
  getCategoryById,
  adminCategoryGet,
  adminCategoryCrud,
} from "../controllers/categoryController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getCategoriesTree);
router.get("/get-by-id", getCategoryById);
router.get("/admin", authMiddleware, adminCategoryGet);
router.post("/admin", authMiddleware, adminCategoryCrud);

export default router;
