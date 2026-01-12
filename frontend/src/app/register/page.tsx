'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'
import axios from 'axios'

type FieldErrors = Record<string, string[]>

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors | null>(null)
  const [statusError, setStatusError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setStatusError('Passwords do not match')
      return
    }
    setStatusError('')
    setErrors(null)
    try {
      const { data } = await api.post('/auth/register/', {
        username,
        email,
        password,
        password_confirm: confirmPassword,
      })
      Cookies.set('access_token', data.access, { path: '/' })
      Cookies.set('refresh_token', data.refresh, { path: '/' })
      router.push('/lessons')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data
        if (responseData && typeof responseData === 'object') {
          setErrors(responseData as FieldErrors)
        } else {
          setStatusError('Unable to register. Try again later.')
        }
      } else {
        setStatusError('Unable to register. Try again later.')
      }
    }
  }

  const renderFieldErrors = (field: string) =>
    errors?.[field]?.map((msg) => (
      <p key={msg} className="text-destructive text-sm">
        {msg}
      </p>
    ))

  return (
    <div className="min-h-[calc(100vh-64px)] bg-cyan-50/50 py-16">
      <div className="mx-auto max-w-md rounded-3xl bg-white/90 p-8 shadow-xl ring-1 shadow-cyan-100 ring-cyan-200/40">
        <h2 className="font-heading text-primary mb-6 text-center text-3xl font-bold">
          Create account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {renderFieldErrors('username')}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {renderFieldErrors('email')}
          <Input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {renderFieldErrors('password')}
          <Input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {renderFieldErrors('password_confirm')}
          {statusError && <p className="text-destructive">{statusError}</p>}
          <Button type="submit" size="lg" className="w-full">
            Sign Up
          </Button>
        </form>
        <p className="text-muted-foreground mt-6 text-center">
          Already have an account?{' '}
          <a href="/login" className="text-primary underline">
            Login
          </a>
        </p>
      </div>
    </div>
  )
}
