import { Router } from "express";
import { createAccount } from "../controllers/user.controller.js";

const router = Router();

router.post("/signup", createAccount);

export default router;