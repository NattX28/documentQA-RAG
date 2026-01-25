import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";
import {
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "../controllers/document.controller";

const router = Router();

router.use(authMiddleware);

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", getDocuments);
router.delete("/:documentId", deleteDocument);

export default router;
