import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";
import { uploadDocument } from "../controllers/document.controller";

const router = Router();

router.use(authMiddleware);

router.post("/upload", upload.single("file"), uploadDocument);

export default router;
