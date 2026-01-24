'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLessons } from '@/hooks/useLessons'

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

export default function LessonsPage() {
  const {
    lessons,
    loading,
    error,
    refetch,
    selectedLesson,
    detailLoading,
    loadLessonDetail,
    clearSelection,
  } = useLessons()

  const [autoSelectDisabled, setAutoSelectDisabled] = useState(false)
  const [languageFilter, setLanguageFilter] = useState('en-US')
  const [levelFilter, setLevelFilter] = useState('beginner')

  const filteredLessons = useMemo(
    () =>
      lessons.filter(
        (lesson) =>
          lesson.language?.toLowerCase() === languageFilter.toLowerCase() &&
          lesson.level?.toLowerCase() === levelFilter.toLowerCase()
      ),
    [lessons, languageFilter, levelFilter]
  )

  const noMatches = lessons.length > 0 && filteredLessons.length === 0
  const activeLessons = filteredLessons

  useEffect(() => {
    if (!autoSelectDisabled && activeLessons.length && !selectedLesson) {
      loadLessonDetail(activeLessons[0].id)
    }
  }, [activeLessons, autoSelectDisabled, loadLessonDetail, selectedLesson])

  const refreshLessons = () => {
    setAutoSelectDisabled(false)
    refetch()
  }

  const handleCloseDetail = () => {
    clearSelection()
    setAutoSelectDisabled(true)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-cyan-50/50 py-12">
      <div className="container mx-auto space-y-6 px-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-foreground text-3xl font-bold">Lessons</h1>
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="text-muted-foreground text-xs tracking-wide uppercase">
                Language
                <select
                  className="border-border hover:border-primary ml-2 rounded-full border bg-white px-4 py-2 text-sm font-medium shadow-sm transition"
                  value={languageFilter}
                  onChange={(event) => setLanguageFilter(event.target.value)}
                >
                  {LANGUAGE_OPTIONS.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-muted-foreground text-xs tracking-wide uppercase">
                Level
                <select
                  className="border-border hover:border-primary ml-2 rounded-full border bg-white px-4 py-2 text-sm font-medium shadow-sm transition"
                  value={levelFilter}
                  onChange={(event) => setLevelFilter(event.target.value)}
                >
                  {LEVEL_OPTIONS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/free-practice">
              <Button size="lg" className="rounded-full px-6 py-3 text-base shadow-md">
                Modo libre
              </Button>
            </Link>
            <Button onClick={refreshLessons} variant="ghost">
              Refresh
            </Button>
          </div>
        </div>

        {noMatches && (
          <p className="text-muted-foreground text-xs">
            No se encontraron lecciones para el filtro seleccionado. Ajusta el idioma o nivel.
          </p>
        )}

        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-40 rounded-2xl bg-white/60 shadow-lg" />
            ))}
          </div>
        )}

        {error && <p className="text-destructive text-center text-sm">{error}</p>}

        {!loading && !error && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeLessons.map((lesson) => (
              <Card
                key={lesson.id}
                role="button"
                onClick={() => loadLessonDetail(lesson.id)}
                className="group border-border hover:border-primary cursor-pointer border-2 bg-white/80 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <CardHeader>
                  <CardTitle className="font-heading text-xl">{lesson.title}</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    {lesson.description}
                  </CardDescription>
                  <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs font-medium uppercase">
                    <span>{lesson.level}</span>
                    <span>{lesson.exercise_count} exercises</span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Button variant="outline" size="sm">
                      View details
                    </Button>
                    <Link href={`/practice?lesson=${lesson.id}`}>
                      <Button size="sm">Practice</Button>
                    </Link>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {selectedLesson && (
          <div className="rounded-3xl bg-white/80 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-foreground text-2xl font-bold">
                {selectedLesson.title}
              </h2>
              <Button onClick={handleCloseDetail} variant="ghost">
                Close
              </Button>
            </div>
            <p role="status" aria-live="polite" className="text-muted-foreground text-sm">
              {detailLoading
                ? 'Loading exercises…'
                : `${selectedLesson.exercises.length} exercises ready to practice`}
            </p>
            {detailLoading ? (
              <p className="text-muted-foreground mt-4 text-sm">Loading exercises...</p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {selectedLesson.exercises.map((exercise) => (
                  <Card
                    key={exercise.id}
                    className="group border-border hover:border-primary border bg-cyan-50/70 shadow-inner transition duration-200 hover:-translate-y-0.5"
                  >
                    <CardHeader>
                      <CardTitle className="font-heading group-hover:text-primary text-lg">
                        {exercise.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-sm">
                        {exercise.text_to_read}
                      </CardDescription>
                      <p className="text-muted-foreground mt-3 text-xs tracking-wide uppercase">
                        Exercise #{exercise.order}
                      </p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
