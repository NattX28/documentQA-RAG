import { SourceChunk } from "./document";

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Document {
  id: string;
  title: string;
  file_name: string;
  file_size: number;
  file_type: string;
  chunk_count: number;
  uploaded_at: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}
