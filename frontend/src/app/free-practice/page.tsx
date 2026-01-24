'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  generateFreePractice,
  textToSpeech,
  assessFreePractice,
  type PracticeResult,
} from '@/lib/api'
import { Mic, Square, Play } from 'lucide-react'
import Link from 'next/link'
import { Reveal } from '@/components/ui/reveal'

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'ru-RU', label: 'Русский' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'it-IT', label: 'Italiano' },
  { value: 'zh-CN', label: '中文 (普通话)' },
]

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const VOICE_MAP: Record<string, string> = {
  'en-US': 'alloy',
  'pt-BR': 'nova',
  'fr-FR': 'shimmer',
  'ru-RU': 'echo',
  'de-DE': 'onyx',
  'it-IT': 'fable',
  'zh-CN': 'coral',
}

type FreePracticeAssessmentResult = PracticeResult

type Status = 'idle' | 'recording' | 'processing'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function FreePracticePage() {
  const [form, setForm] = useState({
    topic: '',
    language: 'en-US',
    level: 'beginner',
    count: '6',
    focus: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phrases, setPhrases] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<FreePracticeAssessmentResult | null>(null)

  const audioCacheRef = useRef<Map<string, string>>(new Map())
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const currentPhrase = phrases[index] ?? ''
  const accuracy = useMemo(() => result?.accuracy_score ?? 0, [result])

  const handleStart = useCallback(async () => {
    if (!form.topic.trim()) {
      setError('Ingresa un tema.')
      return
    }
    const numericCount = Math.max(1, Math.min(10, Number(form.count) || 6))
    setForm((prev) => ({ ...prev, count: numericCount.toString() }))
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await generateFreePractice({
        topic: form.topic.trim(),
        language: form.language,
        level: form.level,
        count: numericCount,
        focus: form.focus.trim(),
      })
      setPhrases(data.phrases)
      setIndex(0)
    } catch {
      setError('No se pudieron generar frases.')
    } finally {
      setLoading(false)
    }
  }, [form])

  const handleNext = () => {
    if (!phrases.length) return
    setIndex((prev) => (prev + 1) % phrases.length)
    setResult(null)
  }

  const handlePlay = useCallback(async () => {
    if (!currentPhrase || isPlaying) return
    setIsPlaying(true)
    try {
      const voice = VOICE_MAP[form.language] ?? 'alloy'
      const cacheKey = `${form.language}|${voice}|${currentPhrase}`
      const cached = audioCacheRef.current.get(cacheKey)

      if (cached) {
        const audio = new Audio(`data:audio/mp3;base64,${cached}`)
        audio.addEventListener('ended', () => setIsPlaying(false))
        await audio.play()
        return
      }

      const { data } = await textToSpeech({
        text: currentPhrase,
        voice,
        language: form.language,
      })
      audioCacheRef.current.set(cacheKey, data.audio)
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`)
      audio.addEventListener('ended', () => setIsPlaying(false))
      await audio.play()
    } catch {
      setIsPlaying(false)
    }
  }, [currentPhrase, form.language, isPlaying])

  const startRecording = useCallback(async () => {
    setError(null)
    setResult(null)
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

      setStatus('processing')
      try {
        const audio = await blobToBase64(blob)
        const { data } = await assessFreePractice({
          audio,
          reference_text: currentPhrase,
          language: form.language,
        })
        setResult(data)
      } catch {
        setError('No se pudo evaluar la pronunciación.')
      } finally {
        setStatus('idle')
      }
    })
    recorder.stop()
  }, [currentPhrase, form.language])

  return (
    <div className="min-h-[calc(100vh-64px)] bg-cyan-50/50 py-12">
      <div className="container mx-auto space-y-6 px-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Modo libre</p>
            <h1 className="font-heading text-foreground text-3xl font-bold">
              Práctica personalizada
            </h1>
          </div>
          <Link href="/lessons">
            <Button className="rounded-full px-5 py-2 text-base shadow-lg">Volver</Button>
          </Link>
        </header>

        <div className="rounded-3xl bg-white/90 p-6 shadow-xl">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-muted-foreground text-xs tracking-wide uppercase">
              Idioma
              <select
                className="border-border mt-2 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm"
                value={form.language}
                onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}
              >
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-muted-foreground text-xs tracking-wide uppercase">
              Nivel
              <select
                className="border-border mt-2 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm"
                value={form.level}
                onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))}
              >
                {LEVEL_OPTIONS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-muted-foreground text-xs tracking-wide uppercase md:col-span-2">
              Tema
              <input
                className="border-border mt-2 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm"
                placeholder="Ej. viajes, comida, trabajo..."
                value={form.topic}
                onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))}
              />
            </label>

            <label className="text-muted-foreground text-xs tracking-wide uppercase">
              Cantidad de frases
              <input
                inputMode="numeric"
                pattern="\d*"
                maxLength={2}
                className="border-border mt-2 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm"
                value={form.count}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '')
                  const bounded = digits === '' ? '' : String(Math.min(10, Number(digits)))
                  setForm((prev) => ({
                    ...prev,
                    count: bounded,
                  }))
                }}
              />
            </label>

            <label className="text-muted-foreground text-xs tracking-wide uppercase">
              Enfoque (opcional)
              <input
                className="border-border mt-2 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm"
                placeholder="Ej. preguntas, pasado simple..."
                value={form.focus}
                onChange={(event) => setForm((prev) => ({ ...prev, focus: event.target.value }))}
              />
            </label>
          </div>

          {error && <p className="text-destructive mt-3 text-sm">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={handleStart} disabled={loading}>
              {loading ? 'Generando...' : 'Empezar'}
            </Button>
            {phrases.length > 0 && (
              <Button variant="outline" onClick={handleNext}>
                Siguiente
              </Button>
            )}
          </div>

          {phrases.length > 0 && (
            <Reveal>
              <div className="border-border mt-6 rounded-2xl border bg-cyan-50/60 p-6 text-center shadow-inner">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Flashcard {index + 1} / {phrases.length}
                </p>
                <p className="text-foreground mt-3 text-2xl font-semibold">{currentPhrase}</p>

                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={handlePlay} disabled={isPlaying}>
                    <Play size={16} className="mr-2" />
                    {isPlaying ? 'Reproduciendo…' : 'Escuchar'}
                  </Button>
                </div>

                <div className="mt-5 flex items-center justify-center gap-3">
                  <Button
                    disabled={status !== 'idle'}
                    onClick={startRecording}
                    className="flex-1 rounded-full px-4"
                  >
                    <Mic size={16} className="mr-2" />
                    Grabar
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={status !== 'recording'}
                    onClick={stopRecording}
                    className="flex-1 rounded-full px-4"
                  >
                    <Square size={16} className="mr-2" />
                    Detener
                  </Button>
                </div>

                {status === 'processing' && (
                  <p className="text-primary mt-3 text-sm">Analizando…</p>
                )}

                {result && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-sm">
                        Accuracy general {accuracy.toFixed(2)}%
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {result.words?.map((word, idx) => (
                        <Reveal key={`${word.word}-${idx}`}>
                          <div className="border-border rounded-2xl border bg-cyan-50/70 p-4">
                            <p className="text-foreground text-sm font-semibold">{word.word}</p>
                            <p className="text-muted-foreground text-xs">
                              Precisión {word.accuracy_score}%
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Error: {word.error_type}
                            </p>
                          </div>
                        </Reveal>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  )
}
