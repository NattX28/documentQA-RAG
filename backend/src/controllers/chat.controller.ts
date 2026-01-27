import type { Request, Response } from "express";
import pool from "../config/database";
import type { Message, Conversation } from "../models/types";
import { generateAnswer, generateAnswerStream } from "../services/rag.service";

export const createConversation = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const title = req.body?.title ?? "New Conversation";

  const result = await pool.query<Conversation>(
    `INSERT INTO conversations (user_id, title)
    VALUES ($1, $2) RETURNING *`,
    [userId, title],
  );

  res.status(201).json({ conversation: result.rows.at(0) });
};

export const sendMessage = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { message, conversationId } = req.body;

  if (!message || !conversationId) {
    return res
      .status(400)
      .json({ error: "Message and conversationId required" });
  }

  // Verify conversation ownership
  const convResult = await pool.query(
    `SELECT id from conversations WHERE id = $1 AND user_id = $2`,
    [conversationId, userId],
  );

  if (convResult.rows.length === 0) {
    return res
      .status(404)
      .json({ success: false, error: "Conversation not found" });
  }

  // Retrieve conversation history before save new message
  const historyResult = await pool.query<Message>(
    `SELECT role, content FROM messages
    WHERE conversation_id = $1
    ORDER BY created_at ASC
    LIMIT 10`,
    [conversationId],
  );

  const history = historyResult.rows;

  // Save user message
  await pool.query(
    `INSERT INTO messages (conversation_id, role, content)
           VALUES ($1, $2, $3)`,
    [conversationId, "user", message],
  );

  // Generate AI response using RAG
  const { answer, sources } = await generateAnswer(message, userId, history);

  // Save assistant message
  await pool.query(
    `INSERT INTO messages (conversation_id, role, content, sources) VALUES ($1, $2, $3, $4)`,
    [conversationId, "assistant", answer, JSON.stringify(sources)],
  );

  // update conversation timestamp
  await pool.query(
    `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
    [conversationId],
  );

  res.json({
    message: answer,
    sources: sources,
  });
};

export const sendMessageStream = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { message, conversationId } = req.body;

  if (!message || !conversationId) {
    return res
      .status(400)
      .json({ error: "Message and conversationId required" });
  }

  // Verify conversation ownership
  const convResult = await pool.query(
    `SELECT id from conversations WHERE id = $1 AND user_id = $2`,
    [conversationId, userId],
  );

  if (convResult.rows.length === 0) {
    return res
      .status(404)
      .json({ success: false, error: "Conversation not found" });
  }

  // Retrieve conversation history before save new message
  const historyResult = await pool.query<Message>(
    `SELECT role, content FROM messages
    WHERE conversation_id = $1
    ORDER BY created_at ASC
    LIMIT 10`,
    [conversationId],
  );

  const history = historyResult.rows;

  // Save user message
  await pool.query(
    `INSERT INTO messages (conversation_id, role, content)
           VALUES ($1, $2, $3)`,
    [conversationId, "user", message],
  );

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Get RAG with Streaming
  const { answer, sources } = await generateAnswerStream(
    message,
    userId,
    history,
    (chunk: string) => {
      // Send each chunk as SSE
      res.write(
        `data: ${JSON.stringify({ type: "chunk", context: chunk })}\n\n`,
      );
    },
  );

  res.write(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`);

  res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);

  // Save assistant message
  await pool.query(
    `INSERT INTO messages (conversation_id, role, content, sources) VALUES ($1, $2, $3, $4)`,
    [conversationId, "assistant", answer, JSON.stringify(sources)],
  );

  // update conversation timestamp
  await pool.query(
    `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
    [conversationId],
  );

  res.end();
};

export const getConversationHistory = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { conversationId } = req.params;

  const convResult = await pool.query(
    `SELECT * FROM conversations WHERE id = $1 AND user_id = $2`,
    [conversationId, userId],
  );

  if (convResult.rows.length === 0) {
    return res
      .status(404)
      .json({ success: false, error: "conversation not found" });
  }

  const messagesResult = await pool.query<Message>(
    `SELECT * FROM messages
    WHERE conversation_id = $1
    ORDER BY created_at ASC`,
    [conversationId],
  );

  res.json({
    conversation: convResult.rows.at(0),
    messages: messagesResult.rows,
  });
};

export const getUserConversations = async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const result = await pool.query<Conversation>(
    `SELECT * FROM conversations
    WHERE user_id = $1
    ORDER BY updated_at DESC`,
    [userId],
  );

  res.json({
    success: true,
    conversations: result.rows,
  });
};

export const deleteConversation = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { conversationId } = req.params;

  const result = await pool.query(
    `DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id`,
    [conversationId, userId],
  );

  if (result.rows.length === 0) {
    return res
      .status(404)
      .json({ success: false, error: "Conversation not found" });
  }

  res.json({ message: "Conversation deleted" });
};
