'use client'

import { useCallback, useEffect, useState } from 'react'
import { getProgress, type UserProgress } from '@/lib/api'

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getProgress()
      setProgress(data)
    } catch (err) {
      setError('No se pudo cargar el progreso.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  return { progress, loading, error, refetch: fetchProgress }
}
