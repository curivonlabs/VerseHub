import { Router } from "express";
import { loginRateLimiter } from "../middleware/authRateLimiter.js";

import {
  createAccount,
  loginAccount,
  getAllUsers,
  getOneUser,
  updateAccount,
  deleteAccount
} from "../controllers/user.controller.js";

import {
  protect,
  adminOnly,
} from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", createAccount);
router.post("/login", loginRateLimiter, loginAccount);

router.get("/", protect, adminOnly, getAllUsers);
router.get("/:id", protect, getOneUser);
router.patch("/account", protect, updateAccount);
router.delete("/account", protect, deleteAccount);

export default router;