// Type definitions for Lumina Tutor

export interface Document {
  id: number;
  filename: string;
  uploaded_at: string;
  namespace: string;
}

export interface Session {
  id: number;
  user_id: number;
  document_id: number;
  document_name?: string;
  competency_score: number;
  teaching_mode: 'scaffolding' | 'balanced' | 'socratic';
  session_start: string;
  last_interaction: string;
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  response: string;
  teaching_mode: string;
  updated_competency_score: number;
  sources?: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface Quiz {
  quiz_id: number;
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  correct_answers: number;
  total_questions: number;
  updated_competency_score: number;
  feedback: QuizFeedback[];
}

export interface QuizFeedback {
  question_number: number;
  question: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  feedback: string;
}

export interface UploadResponse {
  id: number;
  filename: string;
  pinecone_namespace: string;
  uploaded_at: string;
  message: string;
}
