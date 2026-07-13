import express from "express";
import multer from "multer";
import path from "path";
import {
  getStats,
  uploadCatalog,
  getCatalogs,
  deleteCatalog,
  uploadImage,
  importProductsXlsx,
  importXml,
} from "../controllers/importController.js";
import authMiddleware from "../middleware/authMiddleware.js";

// Temp directory for multer uploads
const upload = multer({ dest: "backend/uploads/" });

const router = express.Router();

router.get("/stats", getStats);
router.post("/upload-catalog", authMiddleware, upload.single("catalog"), uploadCatalog);
router.get("/catalogs", authMiddleware, getCatalogs);
router.post("/delete-catalog", authMiddleware, deleteCatalog);
router.post("/upload-image", authMiddleware, upload.single("image"), uploadImage);

// Iframe streaming endpoints
router.get("/import-xlsx", (req, res, next) => {
  req.startTime = performance.now();
  next();
}, importProductsXlsx);

router.get("/import-xml", (req, res, next) => {
  req.startTime = performance.now();
  next();
}, importXml);

export default router;
