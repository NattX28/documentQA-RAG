import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createConversation,
  deleteConversation,
  getConversationHistory,
  getUserConversations,
} from "../controllers/chat.controller";

const router = Router();

router.use(authMiddleware);

router.post("/create", createConversation);
router.get("/", getUserConversations);
router.post("/:conversationId", getConversationHistory);
router.delete("/:conversationId", deleteConversation);

export default router;
