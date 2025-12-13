// Types for MBA Copilot

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export interface Source {
  text: string;
  score: number;
  filename: string;
}

export interface Document {
  id: string;
  filename: string;
  chunks: number;
  uploaded_at: string;
}

export interface ChatRequest {
  message: string;
  history?: { role: string; content: string }[];
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export interface UploadResponse {
  success: boolean;
  document_id: string;
  filename: string;
  chunks: number;
}

export interface DocumentsResponse {
  documents: Document[];
}
