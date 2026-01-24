'use client'

import { useEffect, useRef, useState, type PropsWithChildren } from 'react'

interface RevealProps extends PropsWithChildren {
  className?: string
  threshold?: number
  rootMargin?: string
}

export function Reveal({
  children,
  className = '',
  threshold = 0.2,
  rootMargin = '0px 0px -10% 0px',
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setVisible(true))
          observer.unobserve(node)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return (
    <div ref={ref} className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}>
      {children}
    </div>
  )
}
