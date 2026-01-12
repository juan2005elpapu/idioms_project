'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Cookies from 'js-cookie'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const pathname = usePathname()
  const isLoggedIn = !!Cookies.get('access_token')

  const handleLogout = () => {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    window.location.href = '/login'
  }

  return (
    <nav className="border-border bg-background border-b">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-heading text-primary text-2xl font-bold">
          SpeakBetter
        </Link>
        <div className="flex flex-wrap items-center gap-3">
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
                My Progress
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
