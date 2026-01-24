import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.POENAI_API_KEY,
});

// Embedding for text
export const createEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    if (!response.data[0]) {
      throw new Error("Failed to create embedding");
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding error:", error);
    throw error;
  }
};

// Embedding for texts(batch)
export const createEmbeddings = async (
  texts: string[],
): Promise<number[][]> => {
  try {
    const batchSize = 100; // openAI limit
    const batches: string[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    // Process each batch
    const allEmbeddings: number[][] = [];
    for (const batch of batches) {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
      });

      const embeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);

      allEmbeddings.push(...embeddings);
    }
    return allEmbeddings;
  } catch (error) {
    console.error("Batch embedding error:", error);
    throw error;
  }
};
