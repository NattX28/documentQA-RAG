import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createConversation,
  deleteConversation,
  getConversationHistory,
  getUserConversations,
  sendMessage,
  sendMessageStream,
} from "../controllers/chat.controller";

const router = Router();

router.use(authMiddleware);

router.post("/send", sendMessage);
router.post("/message-stream", sendMessageStream);

export default router;
