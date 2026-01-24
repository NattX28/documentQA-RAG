import pool from "../config/database";
import { supabase } from "../config/supabase";
import type { Document, ParsedDocument } from "../models/types";
import { smartChunk, smartChunkWithPages } from "../utils/chunking";
import { parseFile } from "../utils/fie-parser";
import { createEmbeddings } from "./embedding.service";

export const uploadDocument = async (
  userId: string,
  file: Express.Multer.File,
): Promise<Document> => {
  let uploadedPath: string | null = null;

  try {
    const parsedDoc = await parseFile(
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    const fileName = `${userId}/${Date.now()}_${file.originalname}`;
    // Upload to supabase

    const { data: storageData, error: storageError } = await supabase.storage
      .from("documents")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (storageError) {
      console.error("Storage error:", storageError);
      throw new Error(storageError.message);
    }

    uploadedPath = storageData.path;

    // Save doc metadata
    const result = await pool.query<Document>(
      `INSERT INTO documents (user_id, title, file_name, file_size, file_type, content, storage_path) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        userId,
        file.originalname,
        file.originalname,
        file.size,
        file.mimetype,
        parsedDoc.text,
        uploadedPath,
      ],
    );

    const document = result.rows.at(0);
    if (!document) {
      throw new Error("Failed to insert document into database");
    }

    processDocumentChunks(document.id, parsedDoc); // Process document in background

    return document;
  } catch (error) {
    // Rollback if DB crash
    if (uploadedPath) {
      await supabase.storage.from("documents").remove([uploadedPath]);
      console.log(`Rollback: Deleted uploaded file at ${uploadedPath}`);
    }
    console.error("Document upload error:", error);
    throw error;
  }
};

export const processDocumentChunks = async (
  documentId: string,
  parsedDoc: ParsedDocument,
) => {
  try {
    let chunks;

    // PDF
    if (parsedDoc.pages) {
      console.log(`Chunking PDF with ${parsedDoc.pages.length} pages...`);
      chunks = await smartChunkWithPages(parsedDoc.pages, 1000, 200);
    } else {
      // DOCX/TXT
      chunks = await smartChunk(parsedDoc.text, 100, 200);
    }

    console.log(`Created ${chunks.length} chunks`);

    // Create embedding
    const embeddings = await createEmbeddings(chunks.map((c) => c.content));
    if (!embeddings || embeddings.length === 0) {
      throw new Error(
        "Failed to generate embeddings: No data returned from OpenAI",
      );
    }

    // Save chunks with embedding and page number
    console.log("Saving chunks to Database");
    const insertPromises = chunks.map(async (chunk, index) => {
      const embedding = embeddings[index];
      if (!embedding) {
        console.error(`Missing embedding for chunk index ${index}`);
        return null;
      }
      // Convert array to string for vector store (pgvector)
      const embeddingArray = `[${embedding.join(",")}]`;

      await pool.query(
        `INSERT INTO document_chunks
        (document_id, content, embedding, chunk_index, page_number)
        VALUES ($1, $2, $3::vector, $4, $5)`,
        [
          documentId,
          chunk.content,
          embeddingArray,
          chunk.index,
          chunk.pageNumber || null,
        ],
      );
    });

    await Promise.all(insertPromises);

    await pool.query(`UPDATE documents SET chunk_count = $1 WHERE id = $2`, [
      chunks.length,
      documentId,
    ]);

    console.log(`Processed ${chunks.length} chunks for document ${documentId}`);
  } catch (error) {
    console.error("Chunk processing error:", error);
    throw error;
  }
};

export const getUserDocuments = async (userId: string): Promise<Document[]> => {
  const result = await pool.query<Document>(
    `SELECT * FROM documents WHERE user_id = $1 ORDER BY uploaded_at DESC`,
    [userId],
  );

  return result.rows;
};

export const getDocumentById = async (
  documentId: string,
  userId: string,
): Promise<Document> => {
  const result = await pool.query<Document>(
    `SELECT * FROM documents WHERE document_id = $1 AND user_id = $2`,
    [documentId, userId],
  );

  if (result.rows) {
    throw new Error("There are no document");
  }
  return result.rows[0];
};

export const deleteDocument = async (
  documentId: string,
  userId: string,
): Promise<void> => {
  const result = await pool.query(
    `SELECT id, storage_path, FROM documents WHERE id = $1 AND user_id = $2`,
    [documentId, userId],
  );

  if (result.rows.length === 0) {
    throw new Error("Document not found or unauthorized");
  }

  const doc = result.rows[0];

  if (doc.storage_path) {
    await supabase.storage.from("documents").remove([doc.storage_path]);
  }

  await pool.query(`DELETE FROM documents WHERE id = $1`, [documentId]);
};
