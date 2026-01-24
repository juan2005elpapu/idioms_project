'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { useProgress } from '@/hooks/useProgress'

export default function ProgressPage() {
  const { progress, loading, error, refetch } = useProgress()

  const summary = useMemo(() => {
    const totalAttempts = progress.reduce((acc, item) => acc + item.attempts, 0)
    const completed = progress.filter((item) => item.completed).length
    const avgBest =
      progress.length > 0
        ? progress.reduce((acc, item) => acc + item.best_score, 0) / progress.length
        : 0
    return { totalAttempts, completed, avgBest }
  }, [progress])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof progress>()
    progress.forEach((item) => {
      const key = item.lesson_title || 'Sin lección'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    })
    return Array.from(map.entries())
  }, [progress])

  return (
    <div className="min-h-[calc(100vh-64px)] bg-cyan-50/50 py-12">
      <div className="container mx-auto space-y-6 px-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Progreso</p>
            <h1 className="font-heading text-foreground text-3xl font-bold">
              Tu avance en pronunciación
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refetch}>
              Actualizar
            </Button>
            <Link href="/lessons">
              <Button className="rounded-full px-5 py-2 text-base shadow-lg">Volver</Button>
            </Link>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="border-border rounded-2xl border bg-white/80 p-4 shadow-sm">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Intentos</p>
            <p className="text-2xl font-semibold">{summary.totalAttempts}</p>
          </div>
          <div className="border-border rounded-2xl border bg-white/80 p-4 shadow-sm">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Completadas</p>
            <p className="text-2xl font-semibold">{summary.completed}</p>
          </div>
          <div className="border-border rounded-2xl border bg-white/80 p-4 shadow-sm">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Mejor promedio</p>
            <p className="text-2xl font-semibold">{summary.avgBest.toFixed(1)}%</p>
          </div>
        </div>

        {loading && <p className="text-muted-foreground text-sm">Cargando progreso…</p>}
        {error && <p className="text-destructive text-sm">{error}</p>}

        {!loading && !error && (
          <div className="space-y-6">
            {grouped.map(([lessonTitle, items]) => (
              <Reveal key={lessonTitle}>
                <div className="rounded-3xl bg-white/80 p-6 shadow-xl">
                  <h2 className="font-heading text-lg font-semibold">{lessonTitle}</h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {items.map((item) => (
                      <Reveal key={item.id}>
                        <div className="border-border rounded-2xl border bg-cyan-50/70 p-4">
                          <p className="text-foreground text-sm font-semibold">
                            {item.exercise_title}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Mejor: {item.best_score.toFixed(1)}%
                          </p>
                          <p className="text-muted-foreground text-xs">Intentos: {item.attempts}</p>
                          <p className="text-muted-foreground text-xs">
                            Estado: {item.completed ? 'Completado' : 'En progreso'}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Último intento: {new Date(item.last_attempt_at).toLocaleString()}
                          </p>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
