import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // enviar cookies si existen
})

api.interceptors.request.use((config) => {
  const token =
    Cookies.get('access_token') ||
    (typeof window !== 'undefined' && localStorage.getItem('access_token'))
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores de auth
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface LessonSummary {
  id: number
  title: string
  description: string
  level: string
  language: string
  exercise_count: number
}

export interface ExerciseDetail {
  id: number
  title: string
  text_to_read: string
  order: number
}

export interface LessonDetail {
  id: number
  title: string
  description: string
  level: string
  language: string
  exercises: ExerciseDetail[]
}

export interface UserProgress {
  id: number
  exercise: number
  exercise_title: string
  lesson_title: string
  best_score: number
  attempts: number
  completed: boolean
  last_attempt_at: string
}

export interface WordScore {
  word: string
  accuracy_score: number
  error_type: string
}

export interface PracticeResult {
  recognition_status: string
  pronunciation_score: number
  accuracy_score: number
  fluency_score: number
  completeness_score: number
  words: WordScore[]
}

export interface PracticePayload {
  audio: string
  reference_text: string
  language?: string
  exercise_id?: number
}

export interface FreePracticePayload {
  topic: string
  language?: string
  level?: string
  count?: number
  focus?: string
}

export interface FreePracticeResponse {
  phrases: string[]
}

export interface FreePracticeAssessmentPayload {
  audio: string
  reference_text: string
  language?: string
}

export const getLessons = () => api.get<LessonSummary[]>('/lessons/')

export const getLessonDetail = (id: number) => api.get<LessonDetail>(`/lessons/${id}/`)

export const getProgress = () => api.get<UserProgress[]>('/lessons/progress/')

export const submitPractice = (payload: PracticePayload) =>
  api.post<PracticeResult>('/speech/assess/', payload)

export const textToSpeech = (payload: { text: string; voice?: string; language?: string }) =>
  api.post<{ audio: string }>('/speech/tts/', payload)

export const generateFreePractice = (payload: FreePracticePayload) =>
  api.post<FreePracticeResponse>('/speech/free-practice/', payload)

export const assessFreePractice = (payload: FreePracticeAssessmentPayload) =>
  api.post<PracticeResult>('/speech/assess-free/', payload)

export default api
