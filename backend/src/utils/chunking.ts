import type { TextChunk } from "../models/types";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Text splitter configuration
const createTextSplitter = (
  chunkSize: number = 1000,
  chunkOverlap: number = 200,
) => {
  return new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: [
      "\n\n", // Paragraph breaks
      "\n", // Line breaks
      ". ", // Sentence ends (English)
      "! ",
      "? ",
      "ฯ ", // Thai sentence end
      "。", // Chinese/Japanese
      "；",
      "，",
      " ", // Words
      "", // Characters
    ],
    keepSeparator: false,
    lengthFunction: (text: string) => text.length, // Count by characters
  });
};

// Smart chunking (for all languages)
export const smartChunk = async (
  text: string,
  chunkSize: number = 1000,
  chunkOverlap: number = 200,
): Promise<TextChunk[]> => {
  const splitter = createTextSplitter(chunkSize, chunkOverlap);

  const docs = await splitter.createDocuments([text]);

  return docs.map((doc, index) => ({
    content: doc.pageContent,
    index,
  }));
};

// For PDF
export const smartChunkWithPages = async (
  pages: string[],
  chunkSize: number = 1000,
  chunkOverlap: number = 200,
): Promise<TextChunk[]> => {
  const splitter = createTextSplitter(chunkSize, chunkOverlap);
  const allChunks: TextChunk[] = [];
  let globalIndex = 0;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const pageContent = pages[pageIndex];
    if (!pageContent) {
      throw new Error("No page content");
    }
    const docs = await splitter.createDocuments([pageContent]);

    docs.forEach((doc) => {
      allChunks.push({
        content: doc.pageContent,
        index: globalIndex++,
        pageNumber: pageIndex + 1,
      });
    });
  }

  return allChunks;
};
