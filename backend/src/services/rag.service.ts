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
  const systemTemplate = `You are a helpful AI assistant that answers questions based on the provided context from documents.

  IMPORTANT RULES:
  1. Answer questions using ONLY the information from the context below
  2. If the answer is in the context, provide it clearly and directly
  3. Cite sources using [Source 1], [Source 2], etc.
  4. If information is NOT in the context, say "I don't have that information in the documents"
  5. Answer in the same language as the question (Thai or English)
  6. Be specific and include relevant details from the context

  CONTEXT:
  ${context}`;

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
