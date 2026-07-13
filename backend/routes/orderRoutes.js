import express from "express";
import {
  getOrders,
  createOrder,
  generateGuestUserId,
} from "../controllers/orderController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getOrders);
router.post("/", createOrder);
router.get("/generate-user-id", generateGuestUserId);

export default router;
