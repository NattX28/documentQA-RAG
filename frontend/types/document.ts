export interface SourceChunk {
  document_title: string;
  content: string;
  similarity: number;
  chunk_index: number;
  page_number?: number;
}
