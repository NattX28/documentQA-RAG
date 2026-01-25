import pool from "../config/database";
import type { SourceChunk } from "../models/types";
import { createEmbedding } from "./embedding.service";

export const searchSimilarChunks = async (
  query: string,
  userId: string,
  topK: number = 5,
  threshold: number = 0.7,
): Promise<SourceChunk[]> => {
  try {
    const queryEmbedding = await createEmbedding(query);
    const embeddingArray = `[${queryEmbedding.join(",")}]`;

    const result = await pool.query(
      `SELECT * FROM match_document_chunks($1::vector, $2, $3, $4)`,
      [embeddingArray, threshold, topK, userId],
    );

    return result.rows.map((row) => ({
      document_title: row.document_title,
      content: row.content,
      similarity: row.similarity,
      chunk_index: row.chunk_index,
      page_number: row.page_number,
    }));
  } catch (error) {
    console.error("Vector search error:", error);
    throw error;
  }
};
