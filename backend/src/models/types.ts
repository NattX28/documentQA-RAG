export interface User {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_size: string;
  file_type: string;
  content: string;
  chunk_count: number;
  storage_path?: string;
  uploaded_at: Date;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  embedding: number[];
  page_number?: number;
  metadata?: any;
  chunk_index: any;
  created_at: Date;
}

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  created_at: Date;
}

export interface SourceChunk {
  document_title: string;
  content: string;
  similarity: number;
  chunk_index: number;
  page_number?: number;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

export interface ParsedDocument {
  text: string;
  pages?: string[];
}

export interface TextChunk {
  content: string;
  index: number;
  pageNumber?: number;
}
