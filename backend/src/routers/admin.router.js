import { Router } from "express";

import {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  updateAdminUserRole,
  deleteAdminUser,
} from "../controllers/admin.controller.js";

import {
  protect,
  adminOnly,
} from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/dashboard", getAdminDashboard);
router.get("/users", getAdminUsers);
router.get("/users/:id", getAdminUserById);
router.patch("/users/:id/role", updateAdminUserRole);
router.delete("/users/:id", deleteAdminUser);

export default router;
