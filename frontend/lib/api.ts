import axios from 'axios';
import type {
  Document,
  Session,
  ChatResponse,
  Quiz,
  QuizResult,
  UploadResponse
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Document API
export const uploadDocument = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const listDocuments = async (): Promise<{ documents: Document[] }> => {
  const response = await api.get('/api/upload/documents');
  return response.data;
};

export const deleteDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/api/upload/documents/${documentId}`);
};

// Session API
export const createSession = async (
  userId: number,
  documentId: number
): Promise<Session> => {
  const response = await api.post('/api/chat/session', {
    user_id: userId,
    document_id: documentId,
  });
  
  return response.data;
};

export const getSession = async (sessionId: number): Promise<Session> => {
  const response = await api.get(`/api/chat/session/${sessionId}`);
  return response.data;
};

export const updateCompetency = async (
  sessionId: number,
  competencyScore: number
): Promise<{ competency_score: number; teaching_mode: string }> => {
  const response = await api.put(
    `/api/chat/session/${sessionId}/competency`,
    null,
    { params: { competency_score: competencyScore } }
  );
  
  return response.data;
};

// Chat API
export const sendMessage = async (
  sessionId: number,
  message: string,
  competencyScore?: number
): Promise<ChatResponse> => {
  const response = await api.post('/api/chat/message', {
    session_id: sessionId,
    message,
    competency_score: competencyScore,
  });
  
  return response.data;
};

export const getChatHistory = async (sessionId: number) => {
  const response = await api.get(`/api/chat/session/${sessionId}/history`);
  return response.data;
};

// Quiz API
export const generateQuiz = async (
  documentId: number,
  numQuestions: number = 5,
  difficulty: string = 'mixed'
): Promise<Quiz> => {
  const response = await api.post('/api/quiz/generate', {
    document_id: documentId,
    num_questions: numQuestions,
    difficulty,
  });
  
  return response.data;
};

export const submitQuiz = async (
  quizId: number,
  sessionId: number,
  answers: number[]
): Promise<QuizResult> => {
  const response = await api.post('/api/quiz/submit', {
    quiz_id: quizId,
    session_id: sessionId,
    answers,
  });
  
  return response.data;
};

export const getQuizHistory = async (userId: number) => {
  const response = await api.get(`/api/quiz/history/${userId}`);
  return response.data;
};

export const reviewQuiz = async (quizId: number) => {
  const response = await api.get(`/api/quiz/${quizId}/review`);
  return response.data;
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};
// Settings API
export const getUserSettings = async (userId: number) => {
  const response = await api.get(`/api/settings/${userId}`);
  return response.data;
};

export const updateProfile = async (userId: number, profile: any) => {
  const response = await api.put(`/api/settings/${userId}/profile`, profile);
  return response.data;
};

export const updateNotifications = async (userId: number, notifications: any) => {
  const response = await api.put(`/api/settings/${userId}/notifications`, notifications);
  return response.data;
};

export const updateAppearance = async (userId: number, appearance: any) => {
  const response = await api.put(`/api/settings/${userId}/appearance`, appearance);
  return response.data;
};

export const updateLearning = async (userId: number, learning: any) => {
  const response = await api.put(`/api/settings/${userId}/learning`, learning);
  return response.data;
};
export default api;
