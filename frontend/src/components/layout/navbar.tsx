'use client'

import { useCallback, useSyncExternalStore } from 'react'
import Cookies from 'js-cookie'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

function subscribeToAuth(callback: () => void) {
  // Escucha cambios de storage (por si otro tab modifica cookies)
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getAuthSnapshot() {
  return !!Cookies.get('access_token')
}

function getServerSnapshot() {
  return false // En SSR siempre false
}

export function Navbar() {
  const pathname = usePathname()
  const isLoggedIn = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getServerSnapshot)

  const handleLogout = useCallback(() => {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    window.location.href = '/login'
  }, [])

  return (
    <nav className="border-border bg-background border-b">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-heading text-primary text-2xl font-bold">
          SpeakBetter
        </Link>
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          {isLoggedIn ? (
            <>
              <Link
                href="/lessons"
                className={`hover:text-primary font-medium transition-colors ${
                  pathname === '/lessons' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Lessons
              </Link>
              <Link
                href="/progress"
                className={`hover:text-primary font-medium transition-colors ${
                  pathname === '/progress' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Progress
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-border hover:text-primary min-w-fit bg-white/80 text-black focus-visible:ring-black"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary min-w-fit font-medium hover:text-black"
                >
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="min-w-fit font-medium">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
