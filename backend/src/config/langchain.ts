import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

// Initialize OpenAI LLM
export const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0.3,
  maxTokens: 500,
});

// Initialize OpenAI Embeddings
export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-ada-002",
});
