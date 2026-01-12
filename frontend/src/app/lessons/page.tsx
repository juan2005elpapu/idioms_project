'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLessons } from '@/hooks/useLessons'

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

  useEffect(() => {
    if (!autoSelectDisabled && lessons.length && !selectedLesson) {
      loadLessonDetail(lessons[0].id)
    }
  }, [lessons, loadLessonDetail, selectedLesson, autoSelectDisabled])

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
      <div className="container mx-auto space-y-8 px-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-foreground text-3xl font-bold">Lessons</h1>
          <Button onClick={refreshLessons} variant="ghost">
            Refresh
          </Button>
        </div>

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
            {lessons.map((lesson) => (
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
