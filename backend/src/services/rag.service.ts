import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../config/langchain";
import type { Message, SourceChunk } from "../models/types";
import { searchSimilarChunks } from "./vector.service";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";

export const generateAnswer = async (
  query: string,
  userId: string,
  conversationId?: string,
  history?: Pick<Message, "role" | "content">[],
): Promise<{ answer: string; sources: SourceChunk[] }> => {
  const sources = await searchSimilarChunks(query, userId, 5, 0.7);

  if (sources.length === 0) {
    return {
      answer:
        "No relevant information was found in the uploaded document. Please upload the document before asking the question.",
      sources: [],
    };
  }

  // Build context from sources with define page number
  const context = sources
    .map((source, index) => {
      const pageInfo = source.page_number
        ? ` (page ${source.page_number})`
        : "";

      return `[${index + 1}] from "${source.document_title}"${pageInfo}:${source.content}`;
    })
    .join("\n\n");

  const chatHistory = history?.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content),
  );

  // Create prompt
  const systemTemplate = `คุณเป็น AI ผู้ช่วยตอบคำถามโดยอ้างอิงจากเอกสารที่ให้มา
      กฎการตอบคำถาม:
      1. ตอบเฉพาะจากข้อมูลในเอกสารเท่านั้น
      2. อ้างอิงแหล่งที่มาด้วยหมายเลข [1], [2] เป็นต้น
      3. ถ้าคำตอบไม่อยู่ในเอกสาร ให้บอกว่า "ไม่พบข้อมูลในเอกสาร"
      4. ตอบด้วยภาษาที่ผู้ใช้ถาม ให้เข้าใจง่าย กระชับ และตรงประเด็น
      5. เมื่ออ้างอิง ให้ระบุทั้งชื่อเอกสารและหน้า (ถ้ามี)

      เอกสารอ้างอิง:
      ${context}
      `;

  const humanTemplate = "{question}";

  const chatPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemTemplate),
    new MessagesPlaceholder("chat_history"),
    HumanMessagePromptTemplate.fromTemplate(humanTemplate),
  ]);

  // Generate response
  const formattedPrompt = await chatPrompt.formatMessages({
    context: context,
    question: query,
    chat_history: chatHistory,
  });

  const response = await llm.invoke(formattedPrompt);

  return {
    answer: response.content.toString(),
    sources: sources,
  };
};
