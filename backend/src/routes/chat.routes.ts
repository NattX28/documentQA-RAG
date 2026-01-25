import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createConversation,
  deleteConversation,
  getConversationHistory,
  getUserConversations,
  sendMessage,
} from "../controllers/chat.controller";

const router = Router();

router.use(authMiddleware);

router.post("/send", sendMessage);

export default router;
