'use client'

import { useCallback, useEffect, useState } from 'react'
import { getLessons, getLessonDetail, type LessonSummary, type LessonDetail } from '@/lib/api'
import axios from 'axios'

export function useLessons() {
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<LessonDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchLessons = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getLessons()
      setLessons(response.data)
    } catch (error: unknown) {
      setError(
        axios.isAxiosError(error)
          ? (error.response?.data?.detail ?? 'Unable to load lessons.')
          : 'Unable to load lessons.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLessonDetail = useCallback(async (lessonId: number) => {
    setDetailLoading(true)
    try {
      const response = await getLessonDetail(lessonId)
      setSelectedLesson(response.data)
    } catch (error: unknown) {
      setError(
        axios.isAxiosError(error)
          ? (error.response?.data?.detail ?? 'Unable to load lessons.')
          : 'Unable to load lessons.'
      )
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

  return {
    lessons,
    loading,
    error,
    refetch: fetchLessons,
    selectedLesson,
    detailLoading,
    loadLessonDetail: fetchLessonDetail,
    clearSelection: () => setSelectedLesson(null),
  }
}
