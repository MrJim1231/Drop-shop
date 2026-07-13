import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  getProfile,
  updateProfile,
  requestPasswordReset,
  resetPassword,
  changePassword,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify", verifyEmail);
router.get("/profile", authMiddleware, getProfile);
router.post("/profile/update", authMiddleware, updateProfile);
router.post("/reset-password-request", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/change-password", authMiddleware, changePassword);

export default router;
