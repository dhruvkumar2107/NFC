'use client'
import { useEffect, useRef, ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'
}

export default function ScrollReveal({ children, className = '', delay = 0, direction = 'up' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const getTransform = () => {
      switch (direction) {
        case 'up': return 'translateY(60px)'
        case 'down': return 'translateY(-60px)'
        case 'left': return 'translateX(60px)'
        case 'right': return 'translateX(-60px)'
        case 'scale': return 'scale(0.9)'
        case 'fade': return 'none'
      }
    }

    el.style.opacity = '0'
    el.style.transform = getTransform()
    el.style.transition = `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'none'
          observer.unobserve(el)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, direction])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
