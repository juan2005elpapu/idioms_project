'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePractice } from '@/hooks/usePractice'
import { useSearchParams } from 'next/navigation'
import { Mic, Square, Sparkles, Play } from 'lucide-react'
import { textToSpeech } from '@/lib/api'
import { Reveal } from '@/components/ui/reveal'

const VOICE_MAP: Record<string, string> = {
  'en-US': 'alloy',
  'pt-BR': 'nova',
  'fr-FR': 'shimmer',
  'ru-RU': 'echo',
  'de-DE': 'onyx',
  'it-IT': 'fable',
  'zh-CN': 'coral',
}

export default function PracticePage() {
  const params = useSearchParams()
  const lessonId = params.get('lesson') ? Number(params.get('lesson')) : undefined
  const {
    exercises,
    selectedExercise,
    language,
    status,
    result,
    error,
    startRecording,
    stopRecording,
    setSelectedExercise,
  } = usePractice(lessonId)

  const [isPlaying, setIsPlaying] = useState(false)
  const isRecording = status === 'recording'
  const canRecord = selectedExercise && status === 'idle'
  const accuracy = useMemo(() => result?.accuracy_score ?? 0, [result])
  const audioCacheRef = useRef<Map<string, string>>(new Map())

  const handlePlayInstructions = useCallback(async () => {
    if (!selectedExercise || isPlaying) return
    setIsPlaying(true)
    try {
      const voice = VOICE_MAP[language] ?? 'alloy'
      const cacheKey = `${selectedExercise.id}|${language}|${voice}|${selectedExercise.text_to_read}`
      const cached = audioCacheRef.current.get(cacheKey)
      const audioSrc = cached ? `data:audio/mp3;base64,${cached}` : null

      if (audioSrc) {
        const audio = new Audio(audioSrc)
        audio.addEventListener('ended', () => setIsPlaying(false))
        await audio.play()
        return
      }

      const { data } = await textToSpeech({
        text: selectedExercise.text_to_read,
        voice,
        language,
      })
      audioCacheRef.current.set(cacheKey, data.audio)
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`)
      audio.addEventListener('ended', () => setIsPlaying(false))
      await audio.play()
    } catch (ttsError) {
      setIsPlaying(false)
      console.error(ttsError)
    }
  }, [selectedExercise, isPlaying, language])

  return (
    <div className="min-h-[calc(100vh-64px)] bg-cyan-50/40 py-12">
      <div className="container mx-auto space-y-8 px-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm tracking-wide uppercase">Practice</p>
            <h1 className="font-heading text-foreground text-3xl font-bold">Pronunciation lab</h1>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl bg-white/80 p-6 shadow-xl">
            <h2 className="font-heading text-foreground text-xl font-bold">
              Selecciona un ejercicio
            </h2>
            <div className="mt-4 grid gap-3">
              {exercises.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => setSelectedExercise(exercise)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    exercise.isActive
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary bg-white hover:shadow'
                  }`}
                >
                  <p className="text-foreground font-semibold">{exercise.title}</p>
                  <p className="text-muted-foreground text-sm">{exercise.text_to_read}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/90 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-foreground text-2xl font-bold">Indicaciones</h2>
              <Sparkles className="text-primary" size={24} />
            </div>
            <p className="text-foreground mt-4 text-center text-2xl leading-snug font-semibold">
              {selectedExercise?.text_to_read ?? 'Selecciona una lección para ver el texto.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                disabled={!selectedExercise || isPlaying}
                onClick={handlePlayInstructions}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 rounded-full border px-4 py-2 text-base"
              >
                <Play size={16} />
                {isPlaying ? 'Reproduciendo…' : 'Escuchar texto'}
              </Button>
            </div>
            {status === 'processing' && (
              <p className="text-primary mt-4 text-sm font-medium">Analizando…</p>
            )}
            {error && <p className="text-destructive mt-4 text-sm font-medium">{error}</p>}
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                disabled={!canRecord}
                onClick={startRecording}
                variant="default"
                size="lg"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-base"
              >
                <Mic size={18} />
                Grabar
              </Button>
              <Button
                disabled={!isRecording}
                onClick={stopRecording}
                variant="secondary"
                size="lg"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-base"
              >
                <Square size={18} />
                Detener
              </Button>
            </div>
          </div>
        </section>

        {result && (
          <section className="rounded-3xl bg-white/90 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-foreground text-xl font-bold">Resultados</h3>
              <span className="text-muted-foreground text-sm">Accuracy {accuracy.toFixed(2)}%</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {result.words.map((word) => (
                <Reveal key={word.word}>
                  <div className="border-border rounded-2xl border bg-cyan-50/70 p-4">
                    <p className="text-foreground text-sm font-semibold">{word.word}</p>
                    <p className="text-muted-foreground text-xs">
                      Precisión {word.accuracy_score}%
                    </p>
                    <p className="text-muted-foreground text-xs">Error: {word.error_type}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
