import OpenAI from "openai";
import { embeddings } from "../config/langchain";

const openai = new OpenAI({
  apiKey: process.env.POENAI_API_KEY,
});

// Embedding for text
export const createEmbedding = async (text: string): Promise<number[]> => {
  const embedding = await embeddings.embedQuery(text);
  return embedding;
};

// Embedding for texts(batch)
export const createEmbeddings = async (
  texts: string[],
): Promise<number[][]> => {
  const embeddingsList = await embeddings.embedDocuments(texts);
  return embeddingsList;
};
