'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getLessonDetail,
  submitPractice,
  type ExerciseDetail,
  type PracticeResult,
} from '@/lib/api'

type Status = 'idle' | 'recording' | 'processing'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function usePractice(lessonId?: number) {
  const [exercises, setExercises] = useState<ExerciseDetail[]>([])
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<PracticeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!lessonId) return
    setStatus('idle')
    setResult(null)
    setError(null)
    getLessonDetail(lessonId)
      .then((res) => {
        setExercises(res.data.exercises)
        setSelectedExercise(res.data.exercises[0] ?? null)
      })
      .catch(() => setError('No se pudieron cargar los ejercicios.'))
  }, [lessonId])

  const handleSubmit = useCallback(
    async (blob: Blob) => {
      if (!selectedExercise) {
        setError('Selecciona un ejercicio.')
        return
      }

      setStatus('processing')
      setError(null)
      try {
        const audio = await blobToBase64(blob)
        const payload = {
          audio,
          reference_text: selectedExercise.text_to_read,
          exercise_id: selectedExercise.id,
        }
        const res = await submitPractice(payload)
        setResult(res.data)
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : 'No se pudo procesar la grabación.'
        )
      } finally {
        setStatus('idle')
      }
    },
    [selectedExercise]
  )

  const startRecording = useCallback(async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite grabar audio.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      })
      recorder.start()
      recorderRef.current = recorder
      setStatus('recording')
    } catch {
      setError('No se pudo acceder al micrófono.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder) return
    recorder.addEventListener('stop', async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      recorder.stream.getTracks().forEach((track) => track.stop())
      recorderRef.current = null
      chunksRef.current = []
      await handleSubmit(blob)
    })
    recorder.stop()
    setStatus('processing')
  }, [handleSubmit])

  const selectableExercises = useMemo(
    () =>
      exercises.map((exercise) => ({
        ...exercise,
        isActive: selectedExercise?.id === exercise.id,
      })),
    [exercises, selectedExercise]
  )

  return {
    exercises: selectableExercises,
    selectedExercise,
    status,
    result,
    error,
    startRecording,
    stopRecording,
    setSelectedExercise,
  }
}
