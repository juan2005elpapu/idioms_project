'use client'

import axios from 'axios'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/login/', { email, password })
      Cookies.set('access_token', data.access, { path: '/' })
      Cookies.set('refresh_token', data.refresh, { path: '/' })
      router.push('/lessons')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Invalid credentials')
      } else {
        setError('Invalid credentials')
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-cyan-50/50 py-16">
      <div className="mx-auto max-w-md rounded-3xl bg-white/90 p-8 shadow-xl ring-1 shadow-cyan-100 ring-cyan-200/40">
        <h2 className="font-heading text-primary mb-6 text-center text-3xl font-bold">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full">
            Login
          </Button>
        </form>
        <p className="text-muted-foreground mt-6 text-center">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-primary underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  )
}
