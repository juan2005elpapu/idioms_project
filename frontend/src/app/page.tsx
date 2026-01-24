'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Typewriter } from '@/components/features/typewriter'
import { Reveal } from '@/components/ui/reveal'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="font-heading text-foreground text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Improve Your{' '}
          <Typewriter
            words={['Pronunciation', 'Accent', 'Fluency', 'Confidence']}
            className="text-primary"
          />
        </h1>
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">
          Practice speaking English with AI-powered feedback. Get instant scores and improve your
          accent with personalized exercises.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="font-heading text-base font-semibold">
              Get Started Free
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              size="lg"
              className="border-primary font-heading text-primary hover:bg-primary text-base font-semibold hover:text-black"
            >
              Login
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: 'Instant Feedback',
            description: 'Get real-time pronunciation scores for every word you speak',
            emoji: '🎯',
          },
          {
            title: 'Structured Lessons',
            description: 'Learn with curated lessons from beginner to advanced',
            emoji: '📚',
          },
          {
            title: 'Track Progress',
            description: 'See your improvement over time with detailed statistics',
            emoji: '📈',
          },
        ].map((feature) => (
          <Reveal key={feature.title}>
            <Card className="group border-border hover:border-primary cursor-pointer border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <CardHeader>
                <div className="bg-primary/10 mb-2 flex h-12 w-12 items-center justify-center rounded-lg text-2xl transition-transform duration-300 group-hover:scale-110">
                  {feature.emoji}
                </div>
                <CardTitle className="font-heading text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* Stats Section */}
      <Reveal>
        <div className="bg-primary/5 mt-24 w-full rounded-2xl p-8">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            <div className="group cursor-default">
              <p className="font-heading text-primary text-4xl font-bold transition-transform duration-300 group-hover:scale-110">
                95%
              </p>
              <p className="text-muted-foreground mt-2">Accuracy Rate</p>
            </div>
            <div className="group cursor-default">
              <p className="font-heading text-primary text-4xl font-bold transition-transform duration-300 group-hover:scale-110">
                1000+
              </p>
              <p className="text-muted-foreground mt-2">Exercises</p>
            </div>
            <div className="group cursor-default">
              <p className="font-heading text-primary text-4xl font-bold transition-transform duration-300 group-hover:scale-110">
                24/7
              </p>
              <p className="text-muted-foreground mt-2">Practice Anytime</p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
