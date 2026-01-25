import { Router } from "express";
import { getProfile, login, register } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router: Router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);

export default router;
